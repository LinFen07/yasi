import "./index.scss";
import { Button, Card, Modal, Spin } from "antd";
import { useNavigate } from "react-router";
import { getExam } from "@/api/examPaper";
import { useEffect, useState } from "react";
import stores from "@/stores";
import { getStudentId } from "@/api/login";
import { getExamProgress, hasOngoingExam, initExamProgress, clearAllExamData, clearExamProgress } from "@/utils/helper/examDataManager";

const { Meta } = Card;

const Dashboard = () => {
  const [examList, setExamList] = useState([]);
  const [listLoaded, setListLoaded] = useState(false);
  const [ongoingModalVisible, setOngoingModalVisible] = useState(false);
  const [pendingExamId, setPendingExamId] = useState<number | null>(null);
  const navigate = useNavigate();

  const getTime = (time: string) => {
    const t = new Date(time).getTime();
    const current = new Date().getTime();
    return current > t;
  };

  const fetchGetStudentId = async () => {
    const res = await getStudentId(stores.UserStore.userName);
    console.log(res.data)
    // @ts-ignore
    stores.UserStore.setUserId(res.response.value);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await fetchGetStudentId();
        if (cancelled) return;

        const res = await getExam(stores.UserStore.userId);
        if (cancelled) return;

        const items = res?.response?.items ?? res?.data?.response?.items ?? res?.data?.items ?? [];
        setExamList(items);
      } catch (error) {
        console.log(error);
      } finally {
        if (!cancelled) {
          setListLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleConfirmExam = async (id: number) => {
    console.log('=== handleConfirmExam ===');
    console.log('id:', id, 'type:', typeof id);
    const progress = getExamProgress(id);
    console.log('progress:', progress);

    if (progress) {
      const allCompleted =
        progress.listen.status === 'completed' &&
        progress.read.status === 'completed' &&
        progress.writte.status === 'completed';

      if (allCompleted) {
        console.log('全部完成，直接开始新考试');
        startNewExam(id);
      } else {
        const hasProgress =
          progress.listen.status !== 'not_started' ||
          progress.read.status !== 'not_started' ||
          progress.writte.status !== 'not_started';

        if (hasProgress) {
          console.log('有实际进度，弹出 Modal');
          setPendingExamId(id);
          setOngoingModalVisible(true);
        } else {
          console.log('没有实际进度，直接开始新考试');
          startNewExam(id);
        }
      }
    } else {
      console.log('没有 examProgress，直接开始新考试');
      startNewExam(id);
    }
  };

  const startNewExam = (id: number) => {
    clearAllExamData();
    clearExamProgress(id);
    initExamProgress(id);
    stores.AnswerStore.fullReset();
    stores.ExamStore.fullReset();
    window.open(`/video?id=${id}&type=listen`, "_blank");
  };

  const continueExam = (id: number) => {
    const progress = getExamProgress(id);
    let targetType = 'listen';

    if (progress?.listen.status !== 'completed') {
      targetType = 'listen';
    } else if (progress?.read.status !== 'completed') {
      targetType = 'read';
    } else if (progress?.writte.status !== 'completed') {
      targetType = 'writte';
    }
    console.log(targetType)
    setOngoingModalVisible(false);
    setPendingExamId(null);
    window.open(`/video?id=${id}&type=${targetType}`, "_blank");
  };

  const handleSreachTestResult = (
    id: number,
    isAppraise: number,
    appraise: string
  ) => {
    stores.ExamStore.changePaperId(id);
    if (isAppraise) stores.AnswerStore.appraise = appraise;
    navigate(`/testOver`);
  };

  return (
    <div>
      <div className="app-item-contain appContent">
        <h3 className="index-title-h3">试卷中心</h3>
        <div className="exam-list-wrap">
          {!listLoaded ? (
            <div className="exam-list-loading">
              <Spin />
            </div>
          ) : examList.length === 0 ? (
            <div className="exam-empty-tip">
              目前暂无试卷，需等老师授权派发~
            </div>
          ) : (
            <div
              className="exam-list-grid"
              data-count={Math.min(examList.length, 4)}
            >
              {examList.map((item: any) => (
                <Card hoverable className="exam-card" key={item.examPaperId}>
                  <Meta title={item.examPaperName} className="exam-card-meta" />
                  <div className="exam-card-time">
                    <p className="exam-card-time-label">考试时间</p>
                    <p>{item.startTime}</p>
                    <p>~ {item.endTime}</p>
                  </div>
                  <div className="exam-card-actions">
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => handleConfirmExam(item.examPaperId)}
                    >
                      前往考试
                    </Button>
                    <Button
                      size="large"
                      onClick={() =>
                        handleSreachTestResult(
                          item.examPaperId,
                          item.isAppraise,
                          item.appraise
                        )
                      }
                    >
                      查看结果
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        title="考试未完成"
        open={ongoingModalVisible}
        onCancel={() => setOngoingModalVisible(false)}
        footer={[
          <Button key="continue" type="primary" onClick={() => pendingExamId && continueExam(pendingExamId)}>
            继续考试
          </Button>,
          <Button key="restart" onClick={() => pendingExamId && startNewExam(pendingExamId)}>
            开始新考试
          </Button>,
        ]}
      >
        <p>您有未完成的考试，是否继续？</p>
        {/* <p style={{ marginTop: 12, color: '#666' }}>选择"继续考试"将回到之前的考试进度</p>
        <p style={{ color: '#666' }}>选择"开始新考试"将清空所有数据</p> */}
      </Modal>
    </div>
  );
};

export default Dashboard;
