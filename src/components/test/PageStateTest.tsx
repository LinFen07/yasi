import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Typography, Alert } from 'antd';
import stores from '@/stores';

const { Title, Text } = Typography;

/**
 * 页面状态管理测试组件
 * 用于测试和演示页面刷新后状态恢复功能
 */
const PageStateTest: React.FC = () => {
  const [currentState, setCurrentState] = useState<any>(null);
  const [savedState, setSavedState] = useState<any>(null);

  // 获取当前状态
  const getCurrentState = () => {
    return {
      currentExamIndex: stores.ExamStore.currentExamIndex,
      currentExamTitle: stores.ExamStore.currentExamTitle,
      currentPageType: stores.ExamStore.currentPageType,
      paperId: stores.ExamStore.paperId,
    };
  };

  // 获取保存的状态
  const getSavedState = () => {
    try {
      const saved = localStorage.getItem('examPageState');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  // 更新状态显示
  const updateStateDisplay = () => {
    setCurrentState(getCurrentState());
    setSavedState(getSavedState());
  };

  useEffect(() => {
    updateStateDisplay();
    
    // 定期更新状态显示
    const interval = setInterval(updateStateDisplay, 1000);
    return () => clearInterval(interval);
  }, []);

  // 模拟页面状态变化
  const simulateStateChange = () => {
    const newIndex = stores.ExamStore.currentExamIndex + 1;
    stores.ExamStore.changeCurrent(newIndex);
    stores.ExamStore.changeCurrentTitle(`Part${Math.ceil(newIndex / 10)}`);
    
    // 手动保存状态
    const state = {
      currentExamIndex: newIndex,
      currentExamTitle: stores.ExamStore.currentExamTitle,
      currentPageType: 'writte',
      paperId: stores.ExamStore.paperId,
    };
    localStorage.setItem('examPageState', JSON.stringify(state));
    
    updateStateDisplay();
  };

  // 清除保存的状态
  const clearSavedState = () => {
    localStorage.removeItem('examPageState');
    updateStateDisplay();
  };

  // 恢复保存的状态
  const restoreSavedState = () => {
    if (savedState) {
      stores.ExamStore.changeCurrent(savedState.currentExamIndex);
      stores.ExamStore.changeCurrentTitle(savedState.currentExamTitle);
      stores.ExamStore.changeCurrentPageType(savedState.currentPageType);
      updateStateDisplay();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <Title level={2}>页面状态管理测试</Title>
      
      <Alert
        message="测试说明"
        description="此组件用于测试页面刷新后状态恢复功能。在作文页面刷新后，应该能够保持在正确的Part页面。"
        type="info"
        style={{ marginBottom: '20px' }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="当前状态" size="small">
          <Space direction="vertical">
            <Text><strong>考试索引:</strong> {currentState?.currentExamIndex}</Text>
            <Text><strong>当前标题:</strong> {currentState?.currentExamTitle}</Text>
            <Text><strong>页面类型:</strong> {currentState?.currentPageType}</Text>
            <Text><strong>试卷ID:</strong> {currentState?.paperId}</Text>
          </Space>
        </Card>

        <Card title="保存的状态" size="small">
          {savedState ? (
            <Space direction="vertical">
              <Text><strong>考试索引:</strong> {savedState.currentExamIndex}</Text>
              <Text><strong>当前标题:</strong> {savedState.currentExamTitle}</Text>
              <Text><strong>页面类型:</strong> {savedState.currentPageType}</Text>
              <Text><strong>试卷ID:</strong> {savedState.paperId}</Text>
            </Space>
          ) : (
            <Text type="secondary">没有保存的状态</Text>
          )}
        </Card>

        <Card title="测试操作" size="small">
          <Space wrap>
            <Button onClick={simulateStateChange} type="primary">
              模拟状态变化
            </Button>
            <Button onClick={restoreSavedState} disabled={!savedState}>
              恢复保存状态
            </Button>
            <Button onClick={clearSavedState} danger>
              清除保存状态
            </Button>
            <Button onClick={updateStateDisplay}>
              刷新显示
            </Button>
            <Button onClick={() => window.location.reload()}>
              刷新页面测试
            </Button>
          </Space>
        </Card>

        <Card title="测试步骤" size="small">
          <ol>
            <li>点击"模拟状态变化"按钮改变当前状态</li>
            <li>观察"保存的状态"是否更新</li>
            <li>点击"刷新页面测试"按钮刷新页面</li>
            <li>检查页面刷新后状态是否正确恢复</li>
            <li>在实际的作文页面测试：进入作文2，刷新页面，检查是否还在作文2</li>
          </ol>
        </Card>
      </Space>
    </div>
  );
};

export default PageStateTest;