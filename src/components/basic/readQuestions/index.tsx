import './index.scss'
import {  Radio } from 'antd';
import { useEffect, useState, useRef } from 'react';
import ReactHtmlParser from 'react-html-parser';
import stores from '@/stores';
import { observer } from 'mobx-react'

import { runInAction } from 'mobx';


const questions = () => {
  const exam = stores.ExamStore.getReadExam();

  const questionIndex = stores.ExamStore.currentExamIndex;

  const [readArr, setReadArr] = useState(exam[0]);
  const [questionArr, setQuestionArr] = useState(exam[0].questionItems);
  const titleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1;
    setReadArr(exam[index]);
    setQuestionArr(exam[index].questionItems);
  },[stores.ExamStore.currentExamTitle, exam]);

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1;
    let prevCount = 0;
    for(let i = 0; i < index; i++){
      prevCount += exam[i].questionItems.length;
    }
    if (titleRefs.current[questionIndex - prevCount - 1]) {
      titleRefs.current[questionIndex - prevCount - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [questionIndex]);

  const onChange = (index: number) => (e: any) => {
    const examIndex = +stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1;
    const { value } = e.target;
    let prevCount = 0;
    for(let i = 0; i < examIndex; i++){
      prevCount += exam[i].questionItems.length;
    }

    const updatedQuestions = { ...questionArr[index] };
    updatedQuestions.answer = value;
    const newQuestionsArr = questionArr.map((question, idx) =>
      idx === index ? updatedQuestions : question
    );
    setQuestionArr(newQuestionsArr);
    stores.ExamStore.updateReadExam(examIndex, index, updatedQuestions);
    stores.ExamStore.changeCurrent(prevCount + index + 1);
    runInAction(() => {
      stores.ExamStore.correctListenAnswer.push(prevCount + index + 1);
    });
  };

  return (
    <div className='readContent'>
        <div className='leftContent' >{ReactHtmlParser(readArr.name)}</div>
        <div className='rightContent'>
        {
          questionArr.map((item,i) => {
            return(
              <div key={i}>
                <div ref={el => titleRefs.current[i] = el}>
                  {ReactHtmlParser(item.title)}
                </div>
                {
                  item.questionType == '1'
                  ? <Radio.Group 
                      onChange={onChange(i)} 
                      name={`${i}`}
                      value={item.answer ? item.answer : ''}
                      options={item.items.map((opt) => ({
                        value: opt.prefix,
                        label: ReactHtmlParser(opt.prefix == opt.content ? opt.content : opt.prefix + ' '+ opt.content)
                      }))}
                      > 
                    </Radio.Group>
                  :<></>
                }
              </div>
            )
          })
        }
        </div>
      </div>
  )
}

export default observer(questions);