import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, message, Input, Form } from 'antd';
import ScoringPanel from '../ScoringPanel';
import EvaluationPanel from '../EvaluationPanel';
import { useSelector } from 'react-redux';
const { TextArea } = Input;

// 定义一个函数来将 HTML 转换为纯文本
const convertToText = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.documentElement.textContent;
};



const GradingPanel = ({
  paperData = {},
  onSubmit,
  onCancel,
  editorContent = '',
  setEditorContent,
  setFlag,
  isEditingMode = false
}) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    try {
      form.validateFields()
        .then(() => {
          const submitData = isScoringMode ? {
            comment: editorContent || '',
            score: form.getFieldValue('score') || 0,
            isEditingMode
          } : {
            comment: editorContent || '',
            isEditingMode
          };
          onSubmit(submitData);
        })
        .catch((err) => {
          console.error('表单验证失败:', err);
          message.error('请填写完整的评分和评语');
        });
    } catch (error) {
      console.error('提交评阅出错:', error);
      message.error('提交评阅失败，请重试');
    }
  };

  const [currentPage, setCurrentPage] = useState(1);

  const handlePreviousPage = () => {
    setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };
  const { paper = [], article = {} } = useSelector(state => state.tasks);
  const isScoringMode = paperData.type === 1;
  const items = article?.response?.items || [];
  const studentAnswers = items[0]?.studentAnswers || [];
  const studentAnswer = studentAnswers[0]?.studentAnswer || '';
  const essayTitle = paper[0]?.response?.title || '';

  return (
    <Form form={form}>
      <div style={{ display: 'flex', gap: '16px', height: '100%' }}>
        {/* 左侧：作文展示区域 */}
        <div style={{ flex: 1 }}>
          <Card
            title="试卷批阅"
            style={{ boxShadow: 'none' }}
          >
            <div style={{ padding: 16 }}>
              <h3>考生姓名：{paperData.studentName || '未知考生'}</h3>
            </div>
          </Card>

          {/* 显示作文内容 */}
          <div style={{ flex: 1, marginTop: '40px' }}>
            <h3 style={{ color: 'var(--text-color)' }}>作文标题</h3>
            <TextArea 
              value={convertToText(essayTitle) || ''} 
              readOnly 
              rows={3} 
              style={{ marginBottom: '16px' }} 
            />
            <h3 style={{ color: 'var(--text-color)' }}>学生答案</h3>
            <TextArea 
              value={convertToText(studentAnswer) || ''} 
              readOnly 
              rows={10} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button onClick={handlePreviousPage} disabled={currentPage === 1}>
                上一篇
              </button>
              <button onClick={handleNextPage} disabled={currentPage === 2}>
                下一篇
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：评阅区域 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 评阅编辑区 */}
          <Card
            title={isEditingMode ? "修改评语" : "评阅编辑"}
            style={{ flex: 2 }}
          >
            {isScoringMode ? (
              <ScoringPanel
                form={form}
                editorContent={editorContent}
                setEditorContent={setEditorContent}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                isEditingMode={isEditingMode}
              />
            ) : (
              <EvaluationPanel
                form={form}
                editorContent={editorContent}
                setEditorContent={setEditorContent}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                isEditingMode={isEditingMode}
              />
            )}
          </Card>

          {/* 预览区 */}
          <Card
            title="评阅预览"
            style={{ flex: 1 }}
          >
            <div
              className="ql-editor"
              style={{
                height: '100px',
                overflow: 'auto',
                background: '#fff',
                padding: '16px'
              }}
              dangerouslySetInnerHTML={{
                __html: editorContent || '<p style="color:#999; text-align:center; margin-top:120px">请在上方编辑评语内容</p>'
              }}
            />
          </Card>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <Button onClick={onCancel}>取消</Button>
            <Button
              onClick={() => {
                setEditorContent('');
                form.resetFields(['comment']);
              }}
              danger
            >
              清空
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
            >
              {isEditingMode ? '保存修改' : '提交评阅'}
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );
};

GradingPanel.propTypes = {
  paperData: PropTypes.shape({
    studentName: PropTypes.string,
    id: PropTypes.number,
    questions: PropTypes.array
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editorContent: PropTypes.string,
  setEditorContent: PropTypes.func.isRequired,
  setFlag: PropTypes.func,
  isEditingMode: PropTypes.bool
};

export default GradingPanel;