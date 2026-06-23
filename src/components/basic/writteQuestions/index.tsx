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

function questions() {
  const exam = stores.ExamStore.getWritteExam();
  const examTitle = stores.ExamStore.currentExamTitle;

  const [title, setTitle] = useState(exam[0]?.name || '');
  const [content, setContent] = useState(exam[0]?.questionItems[0]?.title || '');
  const [value, setValue] = useState(['', '']);
  const [wordCOunt, setWordCount] = useState(0);
  const [leftPercent, setLeftPercent] = useState(48);
  const [imeWarningVisible, setImeWarningVisible] = useState(false);

  const writteContentRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const index = +examTitle[4] - 1;
    setTitle(exam[index].name);
    setContent(exam[index].questionItems[0].title);

    setValue((prev) => {
      const updatedValues = [...prev];
      updatedValues[index] = stores.ExamStore.correctWritte[index] || '';
      return updatedValues;
    });
  }, [examTitle, exam]);

  useEffect(() => {
    const index = +examTitle[4] - 1;
    stores.ExamStore.changeWritteAnswer(index, value[index] || '');
    setWordCount(countWords(value[index] || ''));
  }, [value, examTitle]);

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

    const index = +examTitle[4] - 1;
    setValue((prev) => {
      const updatedValues = [...prev];
      updatedValues[index] = finalValue;
      return updatedValues;
    });
  };

  const currentIndex = +examTitle[4] - 1;

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
