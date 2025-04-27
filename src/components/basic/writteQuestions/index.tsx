import './index.scss';
import { useEffect, useState } from 'react';
import ReactHtmlParser from 'react-html-parser';
import { ExamType } from '@/typings/exam';
import stores from '@/stores';

import { Input } from 'antd';
import { submitStudentWritteAnswer } from '@/utils/submitAnswer';
const { TextArea } = Input;

export default function questions() {
  const exam = stores.ExamStore.getWritteExam();

  const [title, setTitle] = useState(exam[0].name);
  const [content, setContent] = useState(exam[0].questionItems[0].title);
  const [value, setValue] = useState(['', '']);

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1;
    setTitle(exam[index].name);
    setContent(exam[index].questionItems[0].title);

    // 设置当前作文的答案
    setValue((prev) => {
      const updatedValues = [...prev];
      updatedValues[index] = stores.AnswerStore.writingAnswers[index]?.studentAnswer || '';
      return updatedValues;
    });
  }, [stores.ExamStore.currentExamTitle, exam]);

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1;
    stores.ExamStore.correctWritte[index] = value[index]; // 更新答案到 MobX store
  },[value]);

  return (
    <div className='readContent'>
      <div className='leftContent'>
        {ReactHtmlParser(title)}
        {ReactHtmlParser(content)}
      </div>
      <TextArea
        className='rightContent'
        value={value[+stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1]} // 根据 index 获取对应的答案
        onChange={(e) => {
          const index = +stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1;
          setValue((prev) => {
            const updatedValues = [...prev];
            updatedValues[index] = e.target.value; // 更新对应作文的答案
            return updatedValues;
          });
        }}
      />
    </div>
  );
}