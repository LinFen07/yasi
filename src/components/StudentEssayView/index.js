import React from 'react';
import PropTypes from 'prop-types';
import { Card, Input } from 'antd';

const { TextArea } = Input;

/**
 * 学生作文共享展示组件
 * @param {object} props - 组件属性
 * @param {string} props.studentName - 学生姓名
 * @param {string} props.studentAnswer - 学生作文答案
 * @param {boolean} [props.showTitle] - 是否显示标题
 */
const StudentEssayView = ({ 
  studentName = '考生',
  studentAnswer = '',
  showTitle = true
}) => {
  return (
    <Card title={`${studentName}的作文`} style={{ marginBottom: '16px' }}>
      {showTitle && <h3 style={{ color: 'var(--text-color)', marginBottom: '16px' }}>学生作文答案</h3>}
      <TextArea 
        value={studentAnswer} 
        readOnly 
        autoSize={{ minRows: 10, maxRows: 20 }}
        style={{ width: '100%' }}
      />
    </Card>
  );
};

StudentEssayView.propTypes = {
  studentName: PropTypes.string,
  studentAnswer: PropTypes.string,
  showTitle: PropTypes.bool
};

export default StudentEssayView;
