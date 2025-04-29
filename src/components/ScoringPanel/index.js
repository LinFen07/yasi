import React from 'react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Form, Input, Card, Button } from 'antd';
import ScoreInput from '../ScoreInput';
import { useSelector } from 'react-redux';

const { TextArea } = Input;

const convertToText = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.documentElement.textContent;
};

const ScoringPanel = ({
  form,
  editorContent,
  setEditorContent,
  onSubmit,
  onCancel,
  isEditingMode,
  paperData,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}) => {
  const { paper = [], article = {} } = useSelector(state => state.tasks);
  const items = article?.response?.items || [];
  const studentAnswers = items[0]?.studentAnswers || [];
  const studentAnswer = studentAnswers[0]?.studentAnswer || '';
  const essayTitle = paper[0]?.response?.title || '';

  return (
    <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
      {/* 左侧：作文内容 */}
      <Card
        title="作文内容"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 8 }}>作文标题</h3>
          <TextArea
            value={convertToText(essayTitle) || ''}
            readOnly
            autoSize
            style={{ width: '100%', marginBottom: 16 }}
          />
          <h3 style={{ marginBottom: 8 }}>作文内容</h3>
          <TextArea
            value={convertToText(studentAnswer) || ''}
            readOnly
            style={{ flex: 1, width: '100%', resize: 'none', marginBottom: 16 }}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Button
              onClick={onPrevious}
              disabled={!hasPrevious}
            >
              上一篇
            </Button>
            <Button
              onClick={onNext}
              disabled={!hasNext}
            >
              下一篇
            </Button>
          </div>
        </div>
      </Card>

      {/* 右侧：合并后的信息与评分区域 */}
      <div style={{ width: '300px' }}>
        <Card title="考生信息与评分">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>姓名：</strong>{paperData?.studentName || '未知'}</div>
              <div><strong>原评分：</strong>{paperData?.score || '未评分'}</div>
            </div>
            
            <Form form={form}>
              <Form.Item
                name="score"
                label="评分"
                rules={[
                  { required: true, message: '请输入评分' },
                  { type: 'number', message: '评分必须为数字' }
                ]}
              >
                <ScoreInput
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <Button onClick={onCancel}>返回</Button>
                <Button type="primary" onClick={onSubmit}>提交修改</Button>
              </div>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
};

ScoringPanel.propTypes = {
  form: PropTypes.object.isRequired,
  editorContent: PropTypes.string,
  setEditorContent: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isEditingMode: PropTypes.bool,
  paperData: PropTypes.object,
  onPrevious: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  hasPrevious: PropTypes.bool,
  hasNext: PropTypes.bool
};

export default ScoringPanel;
