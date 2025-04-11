import React, { useState, useRef, useEffect } from 'react';
import StudentEssayView from '../StudentEssayView';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes, { func } from 'prop-types';
import { Form, Input, Button, Card, Select, message, Modal } from 'antd';
import ScoreInput from '../ScoreInput';
import { fetchCompositionInfo, fetchArticle } from '../../store/tasks';
import { putAppraise } from '../../utils/appraise';
import { fetchAllAppraises } from '../../store/tasks';
const { Option } = Select;
const { TextArea } = Input;
const GradingPanel = ({
  paperData = {},
  onSubmit,
  onCancel,
  setRefreshFlag
}) => {
  const dispatch = useDispatch()
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 200, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const { paper, article } = useSelector(state => state.tasks);
  const theme = useSelector(state => state.user.theme);
  const [currentPage, setCurrentPage] = useState(1);

  const handlePreviousPage = () => {
    setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };
  // console.log(article)
  // 检查 paper 和 paper.response 是否存在
  const essayTitle1 = paper && paper.response && paper.response.titleItems && paper.response.titleItems[5] ? paper.response.titleItems[5].name : '';
  const essayTitle2 = paper && paper.response && paper.response.titleItems && paper.response.titleItems[6] ? paper.response.titleItems[6].name : '';
  const studentAnswer1 = article.response.items?.length > 0 ? article.response.items[0].studentAnswers[0].studentAnswer : "暂无数据";
  const studentAnswer2 = article.response.items?.length > 0 ? article.response.items[0].studentAnswers[0].studentAnswer : "暂无数据";

  // 拖拽处理函数 - 原生JS实现
  const handleDragStart = (e) => {
    if (e.target.closest('.draggable-handle')) {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const initialX = position.x;
      const initialY = position.y;
      const handleDragging = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        // 计算边界限制
        const maxX = window.innerWidth / 2;
        const maxY = window.innerHeight / 2;
        const newX = Math.min(Math.max(initialX + dx, -maxX), maxX);
        const newY = Math.min(Math.max(initialY + dy, -maxY), maxY);

        setPosition({
          x: newX,
          y: newY
        });
      };

      const handleDragEnd = () => {
        document.removeEventListener('mousemove', handleDragging);
        document.removeEventListener('mouseup', handleDragEnd);
      };

      document.addEventListener('mousemove', handleDragging);
      document.addEventListener('mouseup', handleDragEnd);
    }
  };
  return (
    <>
      {/* 试卷展示区域 */}
      <Card
        title="试卷批阅"
        extra={<>
          <Button
            type='primary'
            onClick={() => onCancel()}
            style={{ marginLeft: 8 }}
          >
            返回
          </Button>
          <Button
            type="primary"
            onClick={() => setVisible(true)}
            style={{ marginLeft: 8 }}
          >
            评分
          </Button>
        </>
        }
        style={{ boxShadow: 'none' }}
      >
        <div style={{ padding: 16 }}>
          <h3>考生姓名：{paperData.name || '未知'}</h3>
        </div>
      </Card>
      {/* 显示作文标题和学生答案 添加的代码!!!! */}
      <div style={{ marginBottom: '16px' }}>
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
      {/* 评分弹窗 */}
      {visible && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
            zIndex: 1000,
            background: '#fff',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08), 0 9px 28px 8px rgba(0,0,0,0.05)',
            width: '800px'
          }}
        >
          <div
            className="draggable-handle"
            style={{
              cursor: 'move',
              padding: '16px',
              margin: '-24px -24px 16px -24px',
              borderBottom: '1px solid #f0f0f0'
            }}
            onMouseDown={handleDragStart}
          >
            <h3 style={{ margin: 0 }}>
              {paperData.isEditing ? '编辑评分' : '试卷评分'} - 考生：{paperData.name || '未知'}
            </h3>
          </div>

          <Form
            form={form}
            initialValues={{
              score: paperData.score,
              comment: paperData.comment
            }}
          >
            <Form.Item name="score" label="评分" rules={[{ required: true }]}>
              <ScoreInput />
            </Form.Item>

            <Form.Item name="comment" label="评语">
              <Input.TextArea rows={4} />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {paperData.isEditing && (
                <Button onClick={() => {
                  setVisible(false);
                  onCancel();
                }}>
                  返回
                </Button>
              )}
              <Button onClick={() => {
                setVisible(false);
                onCancel();
              }}>
                {paperData.isEditing ? '取消编辑' : '取消'}
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  form.validateFields()
                    .then(values => {
                      Modal.confirm({
                        title: '确认修改',
                        content: '您确定要修改这份试卷的评分吗？',
                        okText: '确定',
                        cancelText: '取消',
                        onOk: async () => {
                          try {
                            // 调用更新评价数据的逻辑
                            const putappraise = putAppraise(values.comment, paperData.id);
                            await putappraise();
                            setRefreshFlag(prev => !prev);
                            onSubmit(values);
                            setVisible(false);
                            message.success('评分更新成功');
                          } catch (error) {
                            console.error('提交失败:', error);
                            message.error('提交过程中发生错误');
                          }
                        }
                      });
                    })
                    .catch(error => {
                      console.error('表单验证失败:', error);
                    });
                }}
              >
                {paperData.isEditing ? '修改' : '提交'}
              </Button>
            </div>
          </Form>
        </div>
      )}
    </>
  );
};
GradingPanel.propTypes = {
  paperData: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    score: PropTypes.number,
    comment: PropTypes.string,
    paperImage: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default GradingPanel;
