import { useEffect, useState, forwardRef, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button, Space, Avatar, Slider, Modal, Dropdown } from 'antd';
import { FieldTimeOutlined, SoundOutlined, DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './index.scss';
import IntegerStep from '@/components/basic/fontSizeSetting';
import stores from '@/stores';
import { requestConcurrency } from '@/utils/requestConcurrency';
import { submitStudentWritteAnswer, buildWritingSubmitPayload } from '@/utils/browser/submitAnswer';
import { clearModuleData, safeSubmitAndClear, setModuleStatus } from '@/utils/helper/examDataManager';
import { collectListenReadSubmitItems } from '@/utils/helper/mergeSubmitAnswers';
import { persistReportPaperId } from '@/utils/helper/reportPaperId';
import { judgingProblem, submitAnswerBatch } from '@/api/studentAnswer';
import { clearExamHighlights } from '@/components/container/examContent';

const items: MenuProps['items'] = [
  {
    label: (
      <Space style={{ width: '400px' }} direction="vertical">
        <IntegerStep />
      </Space>
    ),
    key: '0',
  },
];

type propType = {
  type: string;
};

const HeadTip = forwardRef((props: propType) => {
  const testTime: number = props.type == 'listen' ? 30 : props.type == 'read' ? 60 : 30;
  const examstore = stores.ExamStore;

  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);
  const [minutes, setMintnue] = useState<number>(testTime);
  const [timerVisible, setTimerVisible] = useState<boolean>(false);
  const [remainingMs, setRemainingMs] = useState<number>(testTime * 60 * 1000);
  const storageKey = `testTimer:${examstore.paperId}:${props.type}`;
  const durationMs = testTime * 60 * 1000;
  const intervalRef = useRef<number | null>(null);
  const isFinishingRef = useRef<boolean>(false);
  const isModalOpenRef = useRef<boolean>(isModalOpen);

  // 保持 isModalOpenRef 与 state 同步
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isFinishingRef.current = false;

    try {
      const raw = localStorage.getItem(storageKey);
      let startAt: number | null = null;
      if (raw) {
        const parsed = JSON.parse(raw);
        startAt = Number(parsed.startAt) || null;
      }
      if (!startAt) {
        startAt = Date.now();
        localStorage.setItem(storageKey, JSON.stringify({ startAt }));
      }

      const tick = () => {
        if (isFinishingRef.current) return;
        if (isModalOpenRef.current) {
          console.log('[Timer] tick skipped because modal is open');
          return;
        }
        const end = (startAt as number) + durationMs;
        const remain = Math.max(0, end - Date.now());
        console.log(`[Timer] tick: remain=${remain}, minutes=${Math.floor(remain / 60000)}, seconds=${Math.floor((remain % 60000) / 1000)}`);
        setRemainingMs(remain);
        setMintnue(Math.floor(remain / 60000));
        setSeconds(Math.floor((remain % 60000) / 1000));
        if (remain <= 0) {
          setModalOpen(true);
        }
      };

      const startTimer = () => {
        if (intervalRef.current) {
          console.log('[Timer] startTimer called but interval already exists, skipping');
          return;
        }
        console.log('[Timer] Starting timer');
        tick();
        intervalRef.current = window.setInterval(tick, 1000);
        console.log(`[Timer] Timer started, id=${intervalRef.current}`);
      };

      const audioRef = document.getElementById('exam-listen-audio') as HTMLAudioElement | null;
      const initAudioAndCountDown = async () => {
        if (props.type !== 'listen') {
          if (audioRef) {
            audioRef.pause();
            audioRef.currentTime = 0;
          }
          startTimer();
          return;
        }

        if (audioRef) {
          const audioUrl = stores.ExamStore.getListenAudioSrc();
          const hasBeenPlayed = audioRef.currentTime > 0 || audioRef.ended;

          if (audioUrl && !hasBeenPlayed) {
            audioRef.src = audioUrl;
            audioRef.load();
          }

          const onPlaying = () => {
            console.log('[Audio] playing event fired, starting timer');
            startTimer();
          };
          audioRef.addEventListener('playing', onPlaying, { once: true });

          try {
            if (hasBeenPlayed) {
              console.log('[Audio] Audio has been played before, skipping play()');
              startTimer();
            } else {
              await audioRef.play();
              setTimeout(() => {
                if (!intervalRef.current) {
                  console.log('[Timer] Backup timeout: starting timer because no interval yet');
                  startTimer();
                }
              }, 5000);
            }
          } catch (error) {
            console.error('音频播放失败:', error);
            startTimer();
          }
        } else {
          startTimer();
        }
      };

      if (['listen', 'read', 'writte'].includes(stores.ExamStore.currentPageType)) {
        initAudioAndCountDown();
      }

      return () => {
        console.log('[Cleanup] useEffect cleanup running, clearing timer if exists');
        if (intervalRef.current) {
          console.log(`[Timer] Cleared interval id=${intervalRef.current} on cleanup`);
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        isFinishingRef.current = false;
      };
    } catch (error) {
      console.error('[Timer] Error in useEffect:', error);
    }
  }, [storageKey, durationMs]);

  const navigate = useNavigate();

  /**
   * 检查未作答作文
   * 有未作答 → 弹提示框，让用户选择「继续作答」或「仍然提交」
   * 全部作答 → 直接 resolve(true)
   */
  const checkWritteBeforeSubmit = (): Promise<boolean> => {
    const writteExam = (examstore as any).wirrteExam || [];
    const answers = (examstore as any).correctWritte || [];

    const unansweredIndexes = writteExam
      .map((_: any, index: number) => index)
      .filter((index: number) => !String(answers[index] ?? '').trim());

    console.log('[checkWritteBeforeSubmit] writteExam.length =', writteExam.length);
    console.log('[checkWritteBeforeSubmit] answers =', JSON.stringify(answers));
    console.log('[checkWritteBeforeSubmit] unansweredIndexes =', unansweredIndexes);

    if (unansweredIndexes.length === 0) {
      return Promise.resolve(true);
    }

    // 拼接未作答的 Part 文案，例如 "Part 1, Part 2"
    const partText = unansweredIndexes
      .map((index: number) => `Part ${index + 1}`)
      .join(', ');

    return new Promise((resolve) => {
      Modal.confirm({
        centered: true,
        title: 'Test Not Completed',
        content: `You have not answered ${partText}. Once submitted, your answers cannot be changed. Do you want to continue answering or submit anyway?`,
        okText: 'Submit Anyway',
        cancelText: 'Continue Answering',
        closable: false,
        maskClosable: false,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };

  /**
   * 点击 Finish Text 按钮：先检查未作答作文，再弹 Test ended
   */
  const handleFinishTextClick = async () => {
    const isWritingModule =
      props.type === 'writte' ||
      props.type === 'write' ||
      props.type === 'writing' ||
      stores.ExamStore.currentPageType === 'writte';

    console.log('[handleFinishTextClick] isWritingModule =', isWritingModule);

    if (isWritingModule) {
      const canSubmit = await checkWritteBeforeSubmit();
      if (!canSubmit) {
        console.log('[handleFinishTextClick] User chose to continue answering');
        return; // 用户选择继续作答 → 不弹 Test ended，不提交
      }
    }

    setModalOpen(true);
  };

  const finish = async (type: string) => {
    console.log('[Finish] Called for type:', type);

    isFinishingRef.current = true;
    if (intervalRef.current) {
      console.log(`[Finish] Clearing interval id=${intervalRef.current}`);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setModalOpen(false);

    setRemainingMs(0);
    setMintnue(0);
    setSeconds(0);
    setTimerVisible(false);

    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('[Finish] Failed to remove storageKey', e);
    }

    if (type === 'listen') {
      const listenData = collectListenReadSubmitItems(
        stores.AnswerStore.completedAnswers,
        stores.ExamStore.paperId,
      );
      const listenData_ = {
        answerItems: [...listenData],
        doTime: 0,
        id: stores.ExamStore.paperId,
        type: 'LISTENING',
      };
      console.log(JSON.stringify(listenData_, null, 2));
      try {
        await judgingProblem(listenData_);
        persistReportPaperId(stores.ExamStore.paperId);
      } catch (error) {
        console.error('听力答案提交失败:', error);
      }
      clearModuleData(type);
      setModuleStatus(examstore.paperId, 'listen', 'completed');
      clearExamHighlights(examstore.paperId, examstore.currentExamTitle);
      navigate(`/video?id=${examstore.paperId}&type=read`, { replace: true });
    } else if (type === 'read') {
      const readData = collectListenReadSubmitItems(
        stores.AnswerStore.completedAnswers,
        stores.ExamStore.paperId,
      );
      const readData_ = {
        answerItems: [...readData],
        doTime: 0,
        id: stores.ExamStore.paperId,
        type: 'READING',
      };
      try {
        await judgingProblem(readData_);
        persistReportPaperId(stores.ExamStore.paperId);
      } catch (error) {
        console.error('阅读答案提交失败:', error);
      }
      clearModuleData(type);
      setModuleStatus(examstore.paperId, 'read', 'completed');
      clearExamHighlights(examstore.paperId, examstore.currentExamTitle);
      navigate(`/video?id=${examstore.paperId}&type=writte`, { replace: true });
    } else if (type === 'writte') {
      try {
        const studentId = stores.UserStore.userId;
        const paperId = examstore.paperId;
        submitStudentWritteAnswer(examstore.wirrteExam[0].questionItems[0], 0, examstore.correctWritte[0]);
        submitStudentWritteAnswer(examstore.wirrteExam[1].questionItems[0], 1, examstore.correctWritte[1]);

        const writingPayload = buildWritingSubmitPayload(
          examstore.wirrteExam,
          examstore.correctWritte,
          paperId,
          studentId,
        );

        if (writingPayload.length > 0) {
          await submitAnswerBatch(writingPayload);
        }
        persistReportPaperId(examstore.paperId);
        setModuleStatus(examstore.paperId, 'writte', 'completed');
        clearExamHighlights(examstore.paperId, examstore.currentExamTitle);
        navigate(`/testOver?id=${examstore.paperId}`, { replace: true });
      } catch (error) {
        console.error('写作提交出错:', error);
        setModuleStatus(examstore.paperId, 'writte', 'completed');
        clearExamHighlights(examstore.paperId, examstore.currentExamTitle);
        navigate(`/testOver?id=${examstore.paperId}`, { replace: true });
      }
    }
    examstore.changeCurrent(1);
    examstore.changeCurrentTitle('Part1');
    examstore.resetcorrectListenAnswer();
  };

  const handleVolumeChange = (value: number) => {
    examstore.changeAusioVolume(value);
  };

  return (
    <div className="head">
      <div className="headLeft">
        <Space>
          <Avatar size={40} className="Avatar" />
          <h3>{stores.UserStore.name}</h3>
        </Space>
      </div>
      <div className="headMid">
        <Space
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setTimerVisible(true)}
          onMouseLeave={() => setTimerVisible(false)}
        >
          <FieldTimeOutlined style={{ fontSize: '28px' }} />
          {remainingMs <= 60000 ? (
            <p>
              {minutes}：{seconds.toString().padStart(2, '0')}
            </p>
          ) : timerVisible ? (
            <p>
              {minutes}：{seconds.toString().padStart(2, '0')}
            </p>
          ) : (
            <p>{minutes} minutes remaining</p>
          )}
        </Space>
        <div className="empty"></div>
        {props.type === 'listen' && (
          <div>
            <Space style={{ height: '100%' }}>
              <SoundOutlined style={{ fontSize: '28px' }} />
              <Slider defaultValue={30} className="slider" onChange={handleVolumeChange} />
              <p style={{ marginLeft: '8px' }}>Audio is playing</p>
            </Space>
          </div>
        )}
      </div>
      <div className="headRight">
        <Space size={24}>
          <Button size="large" onClick={handleFinishTextClick}>
            Finish Text
          </Button>
          <div style={{ fontSize: '16px' }}>
            <Dropdown menu={{ items }} trigger={['click']}>
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  Setting
                  <DownOutlined />
                </Space>
              </a>
            </Dropdown>
          </div>
        </Space>
      </div>
      <Modal
        centered
        title="Test ended"
        open={isModalOpen}
        onOk={() => finish(props.type)}
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="back" type="primary" onClick={() => finish(props.type)}>
            Continue
          </Button>,
        ]}
      >
        <p style={{ fontSize: '18px' }}>Your test has finished.</p>
        <p style={{ fontSize: '18px' }}>All of your answers have been stored.</p>
        <p style={{ fontSize: '18px' }}>Please wait for further instructions.</p>
      </Modal>
    </div>
  );
});

export default HeadTip;