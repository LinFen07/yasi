import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, Button, message, Input, Form } from 'antd';
import ScoreInput from '../ScoreInput';
import { useSelector } from 'react-redux';
const { TextArea } = Input;

const GradingPanel = ({
  paperData,
  onSubmit,
  onCancel,
  editorContent,
  setEditorContent,
  setFlag,
}) => {

  const isEmptyContent = (content) => {
    if (!content) return true;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    return tempDiv.textContent.trim() === '';
  };
  const handleSubmit = () => {
    if (isEmptyContent(editorContent)) {
      message.error('请填写评语内容后再提交');
      return;
    }
    setFlag(true);
    onSubmit({
      comment: editorContent,
      score: paperData.score || 0
    });
    message.success('评阅已提交');
    setEditorContent('');
  };

  const [currentPage, setCurrentPage] = useState(1);
  const handlePreviousPage = () => {
    setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };
  const { paper, article } = useSelector(state => state.tasks);
  const studentAnswer1 = article.response.items ? article.response.items[0].studentAnswers[0].studentAnswer : null
  const studentAnswer2 = article.response.items ? article.response.items[0].studentAnswers[0].studentAnswer : null
  const essayTitle1 = paper && paper.response && paper.response.titleItems && paper.response.titleItems[5] ? paper.response.titleItems[5].name : null;
  const essayTitle2 = paper && paper.response && paper.response.titleItems && paper.response.titleItems[6] ? paper.response.titleItems[6].name : null;
  return (
    <div style={{ display: 'flex', gap: '16px', height: '100%' }}>
      {/* 左侧：作文展示区域 */}
      <div style={{ flex: 1 }}>
        <Card
          title="试卷批阅"
          style={{ boxShadow: 'none' }}
        >
          <div style={{ padding: 16 }}>
            <h3>考生姓名：{paperData?.studentName || '未知'}</h3>
          </div>
        </Card>

        {/* 显示作文内容 */}
        <div style={{ flex: 1, marginTop: '40px' }}>
          {currentPage === 1 && (
            <>
              <h3 style={{ color: 'var(--text-color)' }}>作文标题1</h3>
              <TextArea value={essayTitle1} readOnly rows={3} style={{ marginBottom: '16px' }} />
              <h3 style={{ color: 'var(--text-color)' }}>学生答案</h3>
              <TextArea value={studentAnswer1} readOnly rows={10} />
            </>
          )}
          {currentPage === 2 && (
            <>
              <h3 style={{ color: 'var(--text-color)' }}>作文标题2</h3>
              <TextArea value={essayTitle2} readOnly rows={3} style={{ marginBottom: '16px' }} />
              <h3 style={{ color: 'var(--text-color)' }}>学生答案</h3>
              <TextArea value={studentAnswer2} readOnly rows={10} />
            </>
          )}
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
          title="评阅编辑"
          style={{ flex: 2 }}
        >
          <Form.Item name="score" label="评分" rules={[{ required: true }]}>
            <ScoreInput />
          </Form.Item>
          <ReactQuill
            theme="snow"
            value={editorContent}
            onChange={setEditorContent}
            modules={{
              toolbar: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
              ]
            }}
            style={{ height: '160px', background: '#fff' }}
          />
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
            onClick={() => setEditorContent('')}
            danger
          >
            清空
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={isEmptyContent(editorContent)}
          >
            提交评阅
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GradingPanel;


