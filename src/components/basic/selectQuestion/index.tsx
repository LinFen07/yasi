import {  Radio, Checkbox } from 'antd';
import parse from 'html-react-parser';

export default function selectQuestion({ question, onChange }: any) {
  const Component = question.topicType === '1' ? Radio.Group : Checkbox.Group;
  return (
    <Component
      style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
      onChange={onChange}
      value={question.questionType === '1' ? question.answer : question.selectionsAnswer || []}
      options={question.items.map((opt: any) => ({
        value: opt.prefix,
        label: (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {opt.prefix}
            <p style={{ width: '8px' }}></p>
            {parse(opt.content)}
          </span>
        ),
      }))}
    />
  )
}