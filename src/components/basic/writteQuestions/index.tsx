import './index.scss';
import { useCallback, useEffect, useRef, useState } from 'react';
import parse from 'html-react-parser';
import stores from '@/stores';
import { observer } from 'mobx-react';

import { Input, Modal, Button } from 'antd';
import { countWords } from '@/utils/helper/computed';
import { restrictChineseInput } from '@/utils/helper/inputRestriction';

const { TextArea } = Input;

const MIN_LEFT_PERCENT = 28;
const MAX_LEFT_PERCENT = 72;

function getPartIndex(examTitle: string, examLength: number) {
  const match = String(examTitle).match(/(\d+)/);
  const rawIndex = match ? Number(match[1]) - 1 : 0;
  if (examLength <= 0) return 0;
  return Math.min(Math.max(rawIndex, 0), examLength - 1);
}

function questions() {
  const exam = stores.ExamStore.getWritteExam();
  const examTitle = stores.ExamStore.currentExamTitle;
  const hasExam = exam.length > 0;
  const partIndex = getPartIndex(examTitle, exam.length);
  const currentPart = hasExam ? exam[partIndex] : null;

  const [title, setTitle] = useState(currentPart?.name || '');
  const [content, setContent] = useState(currentPart?.questionItems?.[0]?.title || '');
  const [value, setValue] = useState(['', '']);
  const [wordCOunt, setWordCount] = useState(0);
  const [leftPercent, setLeftPercent] = useState(48);
  const [imeWarningVisible, setImeWarningVisible] = useState(false);

  const writteContentRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!hasExam) return;

    const index = getPartIndex(examTitle, exam.length);
    const part = exam[index];
    if (!part) return;

    setTitle(part.name || '');
    setContent(part.questionItems?.[0]?.title || '');

    setValue((prev) => {
      const updatedValues = [...prev];
      updatedValues[index] = stores.ExamStore.correctWritte[index] || '';
      return updatedValues;
    });
  }, [examTitle, exam, hasExam]);

  useEffect(() => {
    if (!hasExam) return;

    const index = getPartIndex(examTitle, exam.length);
    stores.ExamStore.changeWritteAnswer(index, value[index] || '');
    setWordCount(countWords(value[index] || ''));
  }, [value, examTitle, hasExam]);

  const handleDividerMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!draggingRef.current || !writteContentRef.current) return;
      const rect = writteContentRef.current.getBoundingClientRect();
      const nextPercent = ((event.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(Math.min(MAX_LEFT_PERCENT, Math.max(MIN_LEFT_PERCENT, nextPercent)));
    };

    const handleMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const originalValue = e.target.value;
    const filteredValue = restrictChineseInput(originalValue);
    const finalValue = originalValue !== filteredValue ? filteredValue : originalValue;

    if (originalValue !== filteredValue) {
      setImeWarningVisible(true);
    }

    const index = getPartIndex(examTitle, exam.length);
    setValue((prev) => {
      const updatedValues = [...prev];
      updatedValues[index] = finalValue;
      return updatedValues;
    });
  };

  if (!hasExam) {
    return (
      <div className="writte-empty">
        <h3>暂无写作题目</h3>
        <p>当前试卷未配置写作部分，请联系老师确认后重试。</p>
      </div>
    );
  }

  const currentIndex = partIndex;

  return (
    <div
      className="writteContent"
      ref={writteContentRef}
      style={{ ['--writte-left-ratio' as string]: `${leftPercent}%` }}
    >
      <div className="writte-leftContent">
        {parse(title)}
        {parse(content)}
      </div>
      <div
        className="writte-divider"
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(leftPercent)}
        onMouseDown={handleDividerMouseDown}
      >
        <span className="writte-divider-handle">⇔</span>
      </div>
      <div className="writte-rightContent">
        <TextArea
          className="writte-textarea"
          value={value[currentIndex]}
          onChange={handleOnChange}
          onKeyDown={(e) => {
            if (e.key === 'Process' || (e.nativeEvent as KeyboardEvent).isComposing) {
              e.preventDefault();
              setImeWarningVisible(true);
            }
          }}
          onCompositionStart={(e) => {
            e.preventDefault();
            setImeWarningVisible(true);
          }}
          onCompositionEnd={(e) => {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const filteredValue = restrictChineseInput(target.value);
            setValue((prev) => {
              const updatedValues = [...prev];
              updatedValues[currentIndex] = filteredValue;
              return updatedValues;
            });
          }}
        />
        <div className="writte-word-count">Word count: {wordCOunt}</div>
      </div>

      <Modal
        centered
        className="writte-ime-modal"
        open={imeWarningVisible}
        closable={false}
        maskClosable={false}
        footer={
          <div className="writte-ime-modal-footer">
            <Button
              key="confirm"
              type="primary"
              size="large"
              className="writte-ime-confirm-btn"
              onClick={() => setImeWarningVisible(false)}
            >
              确认
            </Button>
          </div>
        }
      >
        <p className="writte-ime-warning">请不要使用中文输入法</p>
      </Modal>
    </div>
  );
}

export default observer(questions);
