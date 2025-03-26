import {  Radio } from 'antd';
import { useEffect, useState, useRef } from 'react';
import stores from '@/stores';

import ReactHtmlParser from 'react-html-parser';

import { observer } from 'mobx-react';
import './index.scss'

import { runInAction } from 'mobx';

const questions = () => {

  const exam = stores.ExamStore.getListenExam();

  const [listensArr, setListensArr] = useState(exam[0]);
  const [questionsArr, setQuestionArr] = useState(listensArr.questionItems);
  const questionIndex = stores.ExamStore.currentExamIndex;

  const titleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1;
    setListensArr(exam[index]);
    setQuestionArr(exam[index].questionItems);
  },[stores.ExamStore.currentExamTitle, exam]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const span = document.querySelectorAll('.gapfilling-span');
      if (span.length === 0) return;
      for (let i = 0; i < span.length; i++) {
        const input = document.createElement('input');
        input.className = 'textInput';
        span[i].innerHTML = '';
        span[i].appendChild(input);
      }
    }, 0); // 延迟 0 毫秒
  
    return () => clearTimeout(timeoutId);
  }, [stores.ExamStore.currentExamTitle]);

  
  const onChange = (index: number) => (e: any) => {
    const examIndex = +stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1;
    const { value } = e.target;

    const updatedQuestions = { ...questionsArr[index] };
    updatedQuestions.answer = value;
    const newQuestionsArr = questionsArr.map((question, idx) =>
      idx === index ? updatedQuestions : question
    );
    setQuestionArr(newQuestionsArr);
    stores.ExamStore.updateListenExam(examIndex, index, updatedQuestions);
    stores.ExamStore.changeCurrent(index + 1);
    runInAction(() => {
      stores.ExamStore.correctListenAnswer.push(index + 1);
    });
  };

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1;
    let prevCount = 0;
    for(let i = 0; i < index; i++){
      prevCount += exam[i].questionItems.length;
    }
    if (titleRefs.current[questionIndex - prevCount - 1]) {
      titleRefs.current[questionIndex - prevCount - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const inputAll = document.querySelectorAll('.textInput')
    if(inputAll[questionIndex - prevCount - 1]){
      //@ts-ignore
      inputAll[questionIndex - prevCount - 1].focus();
      inputAll[questionIndex - prevCount - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });;
    }
  }, [questionIndex]);


  return (
    <div className='lllll'>
        <div className='contentTitle'>{ReactHtmlParser(listensArr.name)}</div>
        <div className='listencontent'>
          {
            questionsArr.map((questionArr, index) => (
              <div key={index}>
                <div ref={el => titleRefs.current[index] = el}> 
                  {ReactHtmlParser(questionArr.title)}
                </div>
                <div>
                  {
                    questionArr.questionType == '1'
                    ? <Radio.Group 
                    onChange={onChange(index)} 
                    value={questionArr.answer ? questionArr.answer : ''}
                    options={questionArr.items.map((opt) => ({
                    value: opt.prefix,
                    label: ReactHtmlParser(opt.prefix + ' '+ opt.content)
                  }))}
                >
              </Radio.Group>
              :<></>
            }
            </div>
              </div>
            ))
          }
        </div>
      </div>
  )
}

export default observer(questions);