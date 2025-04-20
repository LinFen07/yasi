import './index.scss'
import { useEffect, useState } from 'react';
import ReactHtmlParser from 'react-html-parser';
import stores from '@/stores';
import { observer } from 'mobx-react'
import { createInput } from '@/utils/createInput';
import Questions from '@/components/basic/questions'

const questions = () => {
  //获取试卷
  const exam = stores.ExamStore.getReadExam();
  const [readArr, setReadArr] = useState(exam[0]);

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1;
    setReadArr(exam[index]);
    createInput(exam, 'read');
  },[stores.ExamStore.currentExamTitle]);

  return (
    <div className='readContent'>
        <div className='leftContent parsed-name' >{ReactHtmlParser(readArr.name)}</div>
        <div className='rightContent'>
        <Questions exam={exam}/>
        </div>
      </div>
  )
}

export default observer(questions);