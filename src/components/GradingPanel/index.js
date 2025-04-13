import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, Button, message, Input } from 'antd';
const { TextArea } = Input;

const GradingPanel = ({ 
  paperData = {}, 
  onSubmit, 
  onCancel,
  editorContent,
  setEditorContent
}) => {
  const handleSubmit = () => {
    onSubmit({
      comment: editorContent,
      score: paperData.score || 0
    });
    message.success('评阅已提交');
  };

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
        <div style={{ marginTop: '16px', border: '1px solid #f0f0f0', padding: '16px', height: 'calc(100% - 120px)' }}>
          <h3 style={{ color: 'var(--text-color)' }}>作文标题1</h3>
          <TextArea value={paperData.essayTitle1 || ''} readOnly rows={3} style={{ marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-color)' }}>作文标题2</h3>
          <TextArea value={paperData.essayTitle2 || ''} readOnly rows={3} style={{ marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-color)' }}>学生答案</h3>
          <TextArea value={paperData.studentAnswer || ''} readOnly rows={10} />
        </div>
      </div>

      {/* 右侧：评阅区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 评阅编辑区 */}
        <Card
          title="评阅编辑"
          style={{ flex: 1 }}
        >
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
            style={{ height: '300px', background: '#fff' }}
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
              height: '300px',
              overflow: 'auto',
              background: '#fff',
              padding: '16px'
            }}
            dangerouslySetInnerHTML={{ __html: editorContent }}
          />
        </Card>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>提交评阅</Button>
        </div>
      </div>
    </div>
  );
};

export default GradingPanel;
