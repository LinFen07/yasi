import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Descriptions, Button, Card, Divider, Table, Space, Tag, Pagination } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ScoreInput from '../ScoreInput';
import { useSelector } from 'react-redux';

// 答题情况表格组件
const AnswerTable = ({ questions, pagination }) => {
  const columns = [
    {
      title: '题号',
      dataIndex: 'number',
      key: 'number',
      align: 'center',
      width: 80,
      render: (text, record, index) => index + 1
    },
    {
      title: '正确答案',
      dataIndex: 'correctAnswer',
      key: 'correctAnswer',
      align: 'center',
      render: (text) => text || '未作答'
    },
    {
      title: '作答情况',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (_, record) => (
        <Tag color={record.myAnswer === record.correctAnswer ? 'green' : 'red'}>
          {record.myAnswer === record.correctAnswer ? '正确' : '错误'}
        </Tag>
      )
    },
    {
      title: '我的答案',
      dataIndex: 'myAnswer',
      key: 'myAnswer',
      align: 'center',
      render: (text) => text || '未作答'
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      align: 'center'
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={questions || []}
      pagination={false}
      rowKey="number"
      bordered
      size="small"
    />
  );
};

const ViewGradedPaper = ({
  paperData = {},
  onBack,
  onEdit,
  originalData,
  appraiseData
}) => {
  const { paper, article } = useSelector(state => state.tasks);
  const selectAppraiseById = (data, targetId) => {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item.response && item.response.id === targetId) {
        return item.response.appraise;
      }
    }
    return '无评语';
  };
  const [appraise, setAppraise] = useState('');
  useEffect(() => {
    if (paperData.id) {
      // 使用 selectAppraiseById 函数根据 id 选取评价
      const selectedAppraise = selectAppraiseById(appraiseData, paperData.id);
      setAppraise(selectedAppraise);
    }
  }, [paperData.id, appraiseData]);


  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 上方区域：评分详情和评分明细 */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* 评分详情 */}
        <Card
          title="评分详情"
          extra={
            <Space>
              <Button type="primary" onClick={onEdit}>修改</Button>
              <Button onClick={onBack}>返回</Button>
            </Space>
          }
          style={{ boxShadow: 'none', flex: 1 }}
        >
          <Descriptions column={1} bordered>
            <Descriptions.Item label="学生姓名">
              {paperData?.studentName || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="得分">
              <ScoreInput value={paperData.score} disabled />
            </Descriptions.Item>
            <Descriptions.Item label="评语">
              <div dangerouslySetInnerHTML={{ __html: appraise || '无评语' }} />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 评分明细 */}
        <Card
          title="评分明细"
          style={{ boxShadow: 'none', flex: 1 }}
        >
          <Table
            bordered
            size="small"
            columns={[
              {
                title: '题号',
                dataIndex: 'number',
                key: 'number',
                align: 'center',
                width: 80
              },
              {
                title: '分值',
                dataIndex: 'points',
                key: 'points',
                align: 'center',
                width: 80
              },
              {
                title: '得分',
                dataIndex: 'score',
                key: 'score',
                align: 'center',
                width: 80
              }
            ]}
            dataSource={paperData.questions || []}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </div>

      {/* 下方区域：答题情况 */}
      <Card
        title="答题情况"
        style={{ boxShadow: 'none' }}
      >
        <AnswerTable questions={paperData.questions} />
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            total={paperData.questions?.length || 0}
            showSizeChanger
            showQuickJumper
            pageSizeOptions={['10', '20', '50']}
            defaultPageSize={10}
            showTotal={total => `共 ${total} 条`}
          />
        </div>
      </Card>
    </div>
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
  appraiseData: PropTypes.array
};

export default ViewGradedPaper;
