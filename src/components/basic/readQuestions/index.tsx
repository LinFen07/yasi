import './index.scss'
import { useCallback, useEffect, useRef, useState } from 'react';
import parse from 'html-react-parser';
import stores from '@/stores';
import { observer } from 'mobx-react'
import { createInput } from '@/utils/helper/createInput';
import Questions from '@/components/basic/questions'

const MIN_LEFT_PERCENT = 28;
const MAX_LEFT_PERCENT = 72;

const questions = () => {
  const examTitle = stores.ExamStore.currentExamTitle;
  const exam = stores.ExamStore.getReadExam();
  const [readArr, setReadArr] = useState(exam[0]);
  const [leftPercent, setLeftPercent] = useState(48);
  const containerRef = useRef<HTMLDivElement>(null);
  const readContentRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const index = +examTitle[4] - 1;
    setReadArr(exam[index]);
    if(containerRef.current) {
      createInput(exam, 'read', containerRef.current);
    }
  },[examTitle, exam]);

  const handleDividerMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!draggingRef.current || !readContentRef.current) return;
      const rect = readContentRef.current.getBoundingClientRect();
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
  
  if (!readArr) return null;

  return (
    <div
      className='readContent'
      ref={readContentRef}
      style={{ ['--read-left-ratio' as string]: `${leftPercent}%` }}
    >
      <div className='leftContent parsed-name'>
        {parse(readArr.name || '')}
      </div>
      <div
        className='read-divider'
        role='separator'
        aria-orientation='vertical'
        aria-valuenow={Math.round(leftPercent)}
        onMouseDown={handleDividerMouseDown}
      >
        <span className='read-divider-handle'>⇔</span>
      </div>
      <div className='rightContent' ref={containerRef}>
        <Questions exam={exam}/>
      </div>
    </div>
  )
}

export default observer(questions);
