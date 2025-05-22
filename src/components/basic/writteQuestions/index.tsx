import './index.scss';
import { useEffect, useState } from 'react';
import parse from 'html-react-parser';
import stores from '@/stores';

import { Input } from 'antd';
import { countWords } from '@/utils/computed';
const { TextArea } = Input;
export default function questions() {
  const exam = stores.ExamStore.getWritteExam();

  const [title, setTitle] = useState(exam[0].name);
  const [content, setContent] = useState(exam[0].questionItems[0].title);
  const [value, setValue] = useState(['', '']);
  const [wordCOunt, setWordCount] = useState(0);

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle[4] - 1;
    console.log(index);
    setTitle(exam[index].name);
    setContent(exam[index].questionItems[0].title);

    // 设置当前作文的答案
    setValue((prev) => {
      const updatedValues = [...prev];
      updatedValues[index] = stores.ExamStore.correctWritte[index] || '';
      return updatedValues;
    });
  }, [stores.ExamStore.currentExamTitle, exam]);

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle[4]- 1;
    stores.ExamStore.changeWritteAnswer(index, value[index]); // 更新答案到 MobX store
    const text = value[index];
    const count = countWords(text);

    setWordCount(count);
  },[value]);

  const handleOnChange = (e: any) => {
    const index = +stores.ExamStore.currentExamTitle[4] - 1;
    setValue((prev) => {
      const updatedValues = [...prev];
      updatedValues[index] = e.target.value; // 更新对应作文的答案
      return updatedValues;
    });
    const text = e.target.value;
    const count = countWords(text);

    setWordCount(count);
  }

  return (
    <div className='readContent'>
      <div className='leftContent'>
        {parse(title)}
        {parse(content)}
      </div>
      <div className='rightContent'>
        <TextArea
          className='writte-textarea'
          style={{ height: '90%' }}
          value={value[+stores.ExamStore.currentExamTitle[4] - 1]} // 根据 index 获取对应的答案
          onChange={handleOnChange}
        />
        <div style={{marginTop: '8px'}}>Word count: {wordCOunt}</div>
      </div>
      
    </div>
  );
}