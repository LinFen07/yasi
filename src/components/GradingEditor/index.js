import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card } from 'antd';

const GradingEditor = ({ value, onChange }) => {
  const [editorContent, setEditorContent] = useState(value || '');

  const handleChange = (content) => {
    setEditorContent(content);
    onChange && onChange(content);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* 评阅编辑区 */}
      <Card
        title="评阅编辑"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ flex: 1 }}>
          <ReactQuill
            theme="snow"
            value={editorContent}
            onChange={handleChange}
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
            style={{ height: '100%', background: '#fff' }}
          />
        </div>
      </Card>

      {/* 预览区 */}
      <Card
        title="评阅预览"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div
          className="ql-editor"
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#fff',
            padding: '16px'
          }}
          dangerouslySetInnerHTML={{ __html: editorContent }}
        />
      </Card>
    </div>
  );
};

export default GradingEditor;
