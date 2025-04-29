import React, { useState, useRef } from 'react';
import { Flex } from 'antd';
import PropTypes from 'prop-types';
import CustomReactQuill from '../CustomReactQuill';
import 'react-quill/dist/quill.snow.css';
import { Form, Card, Button, Table, Pagination, Tag } from 'antd';

const EvaluationPanel = ({
  form,
  editorContent,
  setEditorContent,
  onSubmit,
  onCancel,
  isEditingMode,
  paperData = {},
  answers = []
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [splitPosition, setSplitPosition] = useState(50);
  const splitterRef = useRef(null);

  const pageSize = 10; // 每页显示的题目数量

  const columns = [
    {
      title: '题号',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      width: 80
    },
    {
      title: '学生答案',
      dataIndex: 'studentAnswer',
      key: 'studentAnswer',
      align: 'center',
      width: 200,
      render: text => text || '未作答'
    },
    {
      title: '正确答案',
      dataIndex: 'correctAnswer',
      key: 'correctAnswer',
      align: 'center',
      width: 200,
      render: text => text || '无'
    },
    {
      title: '题目详情',
      key: 'isCorrect',
      align: 'center',
      width: 100,
      render: (_, record) => {
        if (record.isCorrect === 2) {
          return <Tag color="blue">作文</Tag>;
        }
        return (
          <Tag color={record.isCorrect === 1 ? 'green' : 'red'}>
            {record.isCorrect === 1 ? '正确' : '错误'}
          </Tag>
        );
      }
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      align: 'center',
      width: 80,
      render: score => score ?? 0
    }
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const currentAnswers = answers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <Form form={form}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        <div
          style={{
            display: 'flex',
            height: 'calc(100vh - 180px)',
            position: 'relative'
          }}
          ref={splitterRef}
        >
          {isEditingMode ? (
            <>
              {/* 编辑模式下显示完整布局 */}
              <div style={{
                width: `${splitPosition}%`,
                paddingRight: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Card
                  title="答题情况"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <Table
                      columns={columns}
                      dataSource={currentAnswers}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </div>
                  <div style={{
                    padding: '16px 0',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <Pagination
                      current={currentPage}
                      total={answers.length}
                      pageSize={pageSize}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper={false}
                      showTotal={total => `共 ${total} 题`}
                    />
                  </div>
                </Card>
              </div>

              {/* 分隔条 */}
              <div
                style={{
                  width: '8px',
                  background: '#f0f0f0',
                  cursor: 'col-resize',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startWidth = splitPosition;

                  const onMouseMove = (e) => {
                    const container = splitterRef.current;
                    if (container) {
                      const newWidth = startWidth + ((e.clientX - startX) / container.clientWidth) * 100;
                      setSplitPosition(Math.min(Math.max(newWidth, 30), 70));
                    }
                  };

                  const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                  };

                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                }}
              >
                <div style={{
                  width: '2px',
                  height: '40px',
                  background: '#d9d9d9'
                }} />
              </div>
            </>
          ) : null}

          {/* 右侧：评价编辑器 */}
          <div style={{
            width: isEditingMode ? `${100 - splitPosition}%` : '100%',
            paddingLeft: isEditingMode ? '8px' : 0,
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
              <Card title="评价预览" style={{ flex: 1 }}>
                <div
                  className="ql-editor"
                  style={{
                    height: '100%',
                    overflow: 'auto',
                    background: '#fff',
                    padding: '16px'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: editorContent || '<p style="color:#999; text-align:center; margin-top:120px">请在右侧编辑评价内容</p>'
                  }}
                />
              </Card>
              <Card title={isEditingMode ? "修改评价" : "撰写评价"} style={{ flex: 1 }}>
                <Form.Item
                  name="comment"
                  label=""
                  rules={[{ required: true, message: '请输入评价内容' }]}
                >
                  <CustomReactQuill
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
                    style={{ height: 'calc(100% - 42px)', background: '#fff' }}
                  />
                </Form.Item>
              </Card>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <Button onClick={onCancel}>取消</Button>
          <Button
            type="primary"
            onClick={onSubmit}
          >
            {isEditingMode ? '保存修改' : '提交评价'}
          </Button>
        </div>
      </div>
    </Form>
  );
};

EvaluationPanel.propTypes = {
  form: PropTypes.object.isRequired,
  editorContent: PropTypes.string,
  setEditorContent: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isEditingMode: PropTypes.bool,
  paperData: PropTypes.object,
  answers: PropTypes.array
};

export default EvaluationPanel;