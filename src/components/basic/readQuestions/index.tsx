import './index.scss'
import { useEffect, useRef, useState } from 'react';
import parse from 'html-react-parser';
import stores from '@/stores';
import { observer } from 'mobx-react'
import { createInput } from '@/utils/createInput';
import Questions from '@/components/basic/questions'

const questions = () => {
  const examTitle = stores.ExamStore.currentExamTitle;
  const exam = stores.ExamStore.getReadExam();
  const [readArr, setReadArr] = useState(exam[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const index = +examTitle[4] - 1;
    setReadArr(exam[index]);
    if(containerRef.current) {
      createInput(exam, 'read', containerRef.current);
    }
  },[examTitle, exam]);
  
  return (
    <div className='readContent'>
      <div className='leftContent parsed-name' >{parse(readArr.name)}</div>
      <div className='rightContent' ref={containerRef}>
        <Questions exam={exam}/>
      </div>
    </div>
  )
}

export default observer(questions);