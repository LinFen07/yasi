
import { useEffect, useRef, useState } from 'react';
import stores from '@/stores';
import ReactHtmlParser from 'react-html-parser';
import { observer } from 'mobx-react';
import './index.scss'
import { createInput } from '@/utils/createInput';

import Questions from '@/components/basic/questions'

const questions = () => {
  const exam = stores.ExamStore.getListenExam();

  const [listensArr, setListensArr] = useState(exam[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle[4] - 1;
    setListensArr(exam[index]);
    if(containerRef.current) {
      createInput(exam, 'read', containerRef.current);
    }
  },[stores.ExamStore.currentExamTitle]);

  return (
    <div className='lllll'>
      <div className='contentTitle'>{ReactHtmlParser(listensArr.name)}</div>
      <div ref={containerRef}>
        <Questions exam={exam}/>
      </div>
     </div>
  )
}

export default observer(questions);