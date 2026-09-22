import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Typography, Alert, Divider, Tag } from 'antd';
import { 
  clearExamLocalData, 
  clearModuleData, 
  clearAllExamData, 
  hasUnsubmittedData, 
  getDataClearReport,
  safeSubmitAndClear 
} from '@/utils/helper/examDataManager';
import stores from '@/stores';

const { Title, Text, Paragraph } = Typography;

/**
 * 考试数据管理器测试组件
 */
const ExamDataManagerTest: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 更新报告
  const updateReport = () => {
    const newReport = getDataClearReport();
    setReport(newReport);
  };

  useEffect(() => {
    updateReport();
    
    // 定期更新报告
    const interval = setInterval(updateReport, 2000);
    return () => clearInterval(interval);
  }, []);

  // 模拟数据提交
  const mockSubmit = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 70% 成功率
        if (Math.random() > 0.3) {
          resolve({ success: true, message: '提交成功' });
        } else {
          reject(new Error('网络错误，提交失败'));
        }
      }, 2000);
    });
  };

  // 测试安全提交和清理
  const testSafeSubmitAndClear = async () => {
    setIsSubmitting(true);
    
    await safeSubmitAndClear(
      mockSubmit,
      () => {
        console.log('提交成功回调');
        updateReport();
        setIsSubmitting(false);
      },
      (error) => {
        console.log('提交失败回调:', error);
        updateReport();
        setIsSubmitting(false);
      }
    );
  };

  // 添加一些测试数据
  const addTestData = () => {
    // 模拟添加一些考试数据
    localStorage.setItem('examStore', JSON.stringify({ test: 'exam data' }));
    localStorage.setItem('answerStore', JSON.stringify({ test: 'answer data' }));
    localStorage.setItem('examPageState', JSON.stringify({ test: 'page state' }));
    localStorage.setItem('testTimer:123:listen', JSON.stringify({ startAt: Date.now() }));
    localStorage.setItem('cachedAnswers', JSON.stringify([{ data: 'cached answer' }]));
    
    updateReport();
  };

  const getStatusTag = (status: boolean) => {
    return status ? <Tag color="green">已清除</Tag> : <Tag color="red">存在数据</Tag>;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px' }}>
      <Title level={2}>考试数据管理器测试</Title>
      
      <Alert
        message="功能说明"
        description="此组件用于测试考试数据管理功能。在接口请求成功后，相关的本地数据会被自动清除。"
        type="info"
        style={{ marginBottom: '20px' }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* 数据状态报告 */}
        <Card title="数据状态报告" size="small">
          {report && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>ExamStore: </Text>
                {getStatusTag(report.examStore)}
              </div>
              <div>
                <Text strong>AnswerStore: </Text>
                {getStatusTag(report.answerStore)}
              </div>
              <div>
                <Text strong>页面状态: </Text>
                {getStatusTag(report.pageState)}
              </div>
              <div>
                <Text strong>缓存答案: </Text>
                {getStatusTag(report.cachedAnswers)}
              </div>
              <div>
                <Text strong>计时器数据: </Text>
                {getStatusTag(report.timers)}
              </div>
              <div>
                <Text strong>未提交数据: </Text>
                {report.hasUnsubmitted ? <Tag color="orange">存在</Tag> : <Tag color="green">无</Tag>}
              </div>
            </Space>
          )}
        </Card>

        {/* 测试操作 */}
        <Card title="测试操作" size="small">
          <Space wrap>
            <Button onClick={addTestData} type="primary">
              添加测试数据
            </Button>
            <Button onClick={() => clearModuleData('listen')}>
              清除听力数据
            </Button>
            <Button onClick={() => clearModuleData('read')}>
              清除阅读数据
            </Button>
            <Button onClick={() => clearModuleData('writte')}>
              清除写作数据
            </Button>
            <Button onClick={() => clearExamLocalData()} danger>
              部分清除数据
            </Button>
            <Button onClick={() => clearAllExamData()} danger>
              清除所有数据
            </Button>
          </Space>
        </Card>

        {/* 安全提交测试 */}
        <Card title="安全提交和清理测试" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>
              此测试模拟真实的提交流程：先提交数据到服务器，成功后清除本地数据。
              如果提交失败，本地数据会保留用于重试。
            </Paragraph>
            <Button 
              onClick={testSafeSubmitAndClear} 
              loading={isSubmitting}
              type="primary"
              size="large"
            >
              {isSubmitting ? '提交中...' : '测试安全提交和清理'}
            </Button>
          </Space>
        </Card>

        <Divider />

        {/* 使用说明 */}
        <Card title="实际使用流程" size="small">
          <ol>
            <li><strong>听力/阅读完成</strong>：调用 `safeSubmitAndClear()` 提交答案，成功后只清除对应模块的数据</li>
            <li><strong>写作完成</strong>：调用 `safeSubmitAndClear()` 提交答案，成功后清除所有考试相关数据</li>
            <li><strong>网络异常</strong>：提交失败时数据保留在本地，网络恢复后自动重试</li>
            <li><strong>考试中断</strong>：页面刷新后可以从本地数据恢复状态</li>
          </ol>
        </Card>

        {/* 数据清理策略 */}
        <Card title="数据清理策略" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Tag color="blue">模块完成</Tag>
              <Text>只清除当前模块的答案数据，保留考试状态</Text>
            </div>
            <div>
              <Tag color="green">考试完成</Tag>
              <Text>清除所有考试相关数据，包括状态、答案、缓存等</Text>
            </div>
            <div>
              <Tag color="orange">提交失败</Tag>
              <Text>保留所有数据，等待网络恢复后重试</Text>
            </div>
            <div>
              <Tag color="red">强制清理</Tag>
              <Text>手动清除所有数据，用于异常情况处理</Text>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default ExamDataManagerTest;