import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Descriptions, Image, Divider, Table, Button, Card, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ScoreInput from '../ScoreInput';
import TextArea from 'antd/es/input/TextArea';
import { useSelector, useDispatch } from 'react-redux';
import { getAppraise } from '../../store/tasks';

// 新增根据id选取评价的函数
const selectAppraiseById = (data, targetId) => {
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item.response && item.response.id === targetId) {
      return item.response.appraise;
    }
  }
  return '无评语';
};

/**
 * 已阅试卷查看组件
 * @param {object} paperData - 试卷数据
 * @param {function} onBack - 返回回调
 */
const ViewGradedPaper = ({
  paperData = {},
  onBack,
  onEdit,
  originalData, // 新增原始数据prop
  appraiseData // 新增 appraiseData prop，用于传入评价数据数组
}) => {
  const dispatch = useDispatch();
  const [appraise, setAppraise] = useState('');
  const { paper, article } = useSelector(state => state.tasks);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (paperData.id) {
      // 使用 selectAppraiseById 函数根据 id 选取评价
      const selectedAppraise = selectAppraiseById(appraiseData, paperData.id);
      setAppraise(selectedAppraise);
    }
  }, [paperData.id, appraiseData]);

  const handleEdit = (e) => {
    e.preventDefault();
    // 恢复原始数据
    const restoredData = {
      ...paperData,
      score: originalData?.score,
      comment: appraise,
      questions: originalData?.questions || []
    };
    onEdit?.(restoredData);
  };

  const handlePreviousPage = () => {
    setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };
  // 检查 paper 和 paper.response 是否存在
  const essayTitle1 = paper && paper.response && paper.response.titleItems && paper.response.titleItems[5] ? paper.response.titleItems[5].name : '';
  const essayTitle2 = paper && paper.response && paper.response.titleItems && paper.response.titleItems[6] ? paper.response.titleItems[6].name : '';
  const studentAnswer1 = article.response.items?.length > 0 ? article.response.items[0].studentAnswers[0].studentAnswer : "暂无数据";
  const studentAnswer2 = article.response.items?.length > 0 ? article.response.items[0].studentAnswers[0].studentAnswer : "暂无数据";

  return (
    <Card
      title={`${paperData.name || '考生'}的已阅试卷`}
      extra={
        <Space>
          <Button
            type="primary"
            onClick={handleEdit}
          >
            修改
          </Button>
          <Button onClick={(e) => {
            e.preventDefault();
            onBack();
          }}>返回</Button>
        </Space>
      }
    >
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* 左侧试卷区域 */}
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

        {/* 右侧评分信息 */}
        <div style={{ flex: 1 }}>
          <Descriptions title="评分详情" column={1} bordered>
            <Descriptions.Item label="学生姓名">
              {paperData.name || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="得分">
              <ScoreInput
                value={paperData.score}
                disabled
              />
            </Descriptions.Item>
            <Descriptions.Item label="评语">
              {appraise}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <div style={{ marginTop: '16px' }}>
            <h4>各题得分明细</h4>
            <Table
              size="small"
              columns={[
                { title: '题号', dataIndex: 'number', key: 'number' },
                { title: '分值', dataIndex: 'points', key: 'points' },
                { title: '得分', dataIndex: 'score', key: 'score' },
              ]}
              dataSource={paperData.questions || []}
              rowKey="id"
              pagination={false}
            />
          </div>

          <Divider />
        </div>
      </div>
    </Card>
  );
};

ViewGradedPaper.propTypes = {
  paperData: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    score: PropTypes.number,
    comment: PropTypes.string,
    paperImage: PropTypes.string,
    questions: PropTypes.array,
    gradedTime: PropTypes.string
  }),
  onBack: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  originalData: PropTypes.shape({
    score: PropTypes.number,
    comment: PropTypes.string,
    questions: PropTypes.array
  }),
  appraiseData: PropTypes.array // 新增 appraiseData 的 prop 类型定义
};

export default ViewGradedPaper;
