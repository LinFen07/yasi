import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Descriptions, Button, Card, Divider, Table, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ScoreInput from '../ScoreInput';
import { useSelector } from 'react-redux';

const ViewGradedPaper = ({
  paperData = {},
  onBack,
  onEdit,
  originalData,
  appraiseData
}) => {
  const { paper, article } = useSelector(state => state.tasks);

  return (
    <div style={{ padding: '24px' }}>
        <Card
          title="评分详情"
          extra={
            <Space>
              <Button type="primary" onClick={onEdit}>修改</Button>
              <Button onClick={onBack}>返回</Button>
            </Space>
          }
          style={{ boxShadow: 'none' }}
        >
          <Descriptions column={1} bordered>
            <Descriptions.Item label="学生姓名">
              {paperData.name || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="得分">
              <ScoreInput value={paperData.score} disabled />
            </Descriptions.Item>
            <Descriptions.Item label="评语">
              {paperData.comment || '无评语'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <div style={{ marginTop: '16px' }}>
            <h4>评分明细</h4>
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
                },
                {
                  title: '评语',
                  dataIndex: 'comment',
                  key: 'comment',
                  align: 'center'
                }
              ]}
              dataSource={paperData.questions || []}
              rowKey="id"
              pagination={false}
              style={{ 
                margin: '0 auto',
                border: '1px solid #d9d9d9'
              }}
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
