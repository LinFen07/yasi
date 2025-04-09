import React, { useState, useEffect } from "react";
import { Table, Button, Tag, Card, message, Spin, Select, Statistic, Breadcrumb } from "antd";
import { useSelector } from "react-redux";
import GradingPanel from "../../components/GradingPanel";
import ViewGradedPaper from "../../components/ViewGradedPaper";

const { Countdown } = Statistic;

const Evaluation = () => {
  const { currentTask } = useSelector(state => state.tasks);
  const [papers, setPapers] = useState([
    {
      id: 1,
      studentName: "张三",
      studentId: "S001",
      paperName: "2023年期中考试数学试卷",
      score: 92,
      comment: "解题思路清晰，计算准确",
      status: "已阅",
      paperImage: "/papers/math-midterm-2023.jpg",
      questions: [
        { id: 1, number: '一', points: 20, score: 18, grader: '王老师', comment: '步骤完整' },
        { id: 2, number: '二', points: 30, score: 28, grader: '王老师', comment: '方法新颖' },
        { id: 3, number: '三', points: 50, score: 46, grader: '李老师', comment: '答案正确' }
      ],
      gradedTime: '2023-05-15 14:30'
    },
    {
      id: 2,
      studentName: '李四',
      studentId: 'S002',
      paperName: '2023年期中考试数学试卷',
      score: 0,
      comment: '',
      status: '待阅',
      paperImage: '/papers/math-midterm-2023-2.jpg',
      questions: [
        { id: 1, number: '一', points: 20, score: undefined, grader: undefined },
        { id: 2, number: '二', points: 30, score: undefined, grader: undefined },
        { id: 3, number: '三', points: 50, score: undefined, grader: undefined }
      ],
      gradedTime: ''
    },
    {
      id: 3,
      studentName: '王五',
      studentId: 'S003',
      paperName: '2023年期中考试英语试卷',
      score: 85,
      comment: '语法准确，写作流畅',
      status: '已阅',
      paperImage: '/papers/english-midterm-2023.jpg',
      questions: [
        { id: 1, number: '听力', points: 30, score: 28, grader: '张老师', comment: '理解准确' },
        { id: 2, number: '阅读', points: 40, score: 35, grader: '张老师', comment: '细节把握到位' },
        { id: 3, number: '写作', points: 30, score: 22, grader: '赵老师', comment: '结构清晰' }
      ],
      gradedTime: '2023-05-16 09:15'
    }
  ]);

  const [currentPaper, setCurrentPaper] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [gradeLoading, setGradeLoading] = useState(false);
  const [essayLoading, setEssayLoading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);

  // 默认选中第一个试卷
  useEffect(() => {
    const fetchInitialPapers = async () => {
      setEssayLoading(true);
      try {
        // 这里模拟API请求获取试卷数据
        // const response = await request.get('/api/papers');
        // setPapers(response.data);
        
        // 验证数据格式并设置第一个试卷
        if (Array.isArray(papers) && papers.length > 0) {
          const firstPaper = papers.find(p => p?.id) || papers[0];
          const validatedPaper = {
            ...firstPaper,
            name: firstPaper.name || firstPaper.studentName || '未知考生',
            status: firstPaper.status || '待阅'
          };

          setCurrentPaper(validatedPaper);
          // 始终默认进入列表模式
          setViewMode('list');
        }
      } catch (error) {
        console.error('初始化试卷数据失败:', error);
        setViewMode('list');
      } finally {
        setEssayLoading(false);
      }
    };

    fetchInitialPapers();
  }, [papers]); // 依赖papers数组

  const handleGradeSubmit = (values) => {
    setGradeLoading(true);
    const updatedPapers = papers.map(p =>
      p.id === currentPaper.id ? {
        ...p,
        score: values.score,
        comment: values.comment,
        status: '已阅',
        gradedTime: new Date().toLocaleString()
      } : p
    );
    setPapers(updatedPapers);

    const nextPaper = updatedPapers.find(p =>
      p.id !== currentPaper.id && p.status === '待阅'
    );

    if (nextPaper) {
      const resetPaper = {
        ...nextPaper,
        score: undefined,
        comment: undefined,
        questions: nextPaper.questions.map(q => ({
          number: q.number,
          points: q.points,
          score: undefined,
          grader: undefined
        }))
      };
      setCurrentPaper(resetPaper);
      setTimeout(() => {
        setGradeLoading(false);
        message.success('已自动跳转到下一份试卷');
      }, 500);
    } else {
      setGradeLoading(false);
      message.success({
        content: '批改已完成',
        duration: 3,
      });
      setTimeout(() => {
        setViewMode('list');
      }, 500);
    }
  };

  const handleStartGrading = () => {
    setEssayLoading(true);
    try {
      const firstPendingPaper = papers.find(p => p.status === '待阅');
      if (firstPendingPaper) {
        setCurrentPaper(firstPendingPaper);
        setViewMode('grade');
      } else {
        message.info('当前没有待阅试卷');
      }
    } finally {
      setEssayLoading(false);
    }
  };

  // 新增编辑处理函数
  const handleEditPaper = (restoredData) => {
    setCurrentPaper({
      ...(restoredData || currentPaper),
      isEditing: true
    });
    setViewMode('grade');
  };

  const handleCancelEdit = () => {
    setCurrentPaper({
      ...currentPaper,
      isEditing: false
    });
    setViewMode('view');
  };

  return (
    <Spin spinning={gradeLoading || essayLoading}>
      <div style={{ padding: '24px' }}>
        {viewMode === 'list' && (
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Breadcrumb 
                style={{ marginBottom: 16 }}
                items={[
                  {
                    title: '试卷批阅'
                  },
                  {
                    title: (
                      <>
                        {selectedPaper || papers[0]?.paperName}
                        <span style={{ marginLeft: 8, color: '#1890ff' }}>
                          (已阅: {papers.filter(p => p.paperName === (selectedPaper || papers[0]?.paperName) && p.status === '已阅').length}
                          /总数: {papers.filter(p => p.paperName === (selectedPaper || papers[0]?.paperName)).length})
                        </span>
                      </>
                    )
                  }
                ]}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                {currentTask?.deadline && (
                  <Countdown
                    title="剩余时间"
                    value={currentTask.deadline}
                    format="HH:mm:ss"
                  />
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Select
                  style={{ width: 200 }}
                  defaultValue={papers[0]?.paperName}
                  value={selectedPaper || papers[0]?.paperName}
                  options={Array.from(new Set(papers.map(p => p.paperName))).map(name => ({
                    value: name,
                    label: name
                  }))}
                  onChange={(value) => setSelectedPaper(value)}
                />
                <Button
                  type="primary"
                  onClick={handleStartGrading}
                  disabled={!papers.some(p => p.status === '待阅')}
                >
                  开始批阅
                </Button>
              </div>
              <Table
                columns={[
                  {
                    title: '考生及试卷',
                    key: 'studentAndPaper',
                    render: (_, record) => (
                      <div>
                        <div>{record.studentName}</div>
                        <div style={{ color: '#888' }}>{record.paperName}</div>
                      </div>
                    ),
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: status => (
                      <Tag color={status === '已阅' ? 'green' : 'orange'}>
                        {status === '已阅' ? '已评阅' : '待评阅'}
                      </Tag>
                    )
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setEssayLoading(true);
            try {
              setCurrentPaper(record);
              setViewMode(record.status === '已阅' ? 'view' : 'grade');
            } finally {
              setEssayLoading(false);
            }
          }}
                      >
                        {record.status === '已阅' ? '查看' : '评阅'}
                      </Button>
                    ),
                  },
                ]}
                dataSource={papers
                  .filter(p => p.paperName === (selectedPaper || papers[0]?.paperName))
                  .sort((a, b) => {
                    // 未评阅的排在前面
                    if (a.status === '待阅' && b.status !== '待阅') return -1;
                    if (a.status !== '待阅' && b.status === '待阅') return 1;
                    return 0;
                  })}
                rowKey="id"
              />
            </div>
          </Card>
        )}

        {/* 评阅模式 */}
        {viewMode === 'grade' && currentPaper && (
          <GradingPanel
            paper={currentPaper}
            onSubmit={handleGradeSubmit}
            onCancel={() => setViewMode('list')}
          />
        )}

        {/* 查看模式 - 完全重写这部分 */}
        {viewMode === 'view' && currentPaper && (
            <ViewGradedPaper
              paperData={currentPaper}
              onBack={() => setViewMode('list')}
              onEdit={handleEditPaper}
              originalData={papers.find(p => p.id === currentPaper.id)}
            />
        )}
      </div>
    </Spin>
  );
};

export default Evaluation;
