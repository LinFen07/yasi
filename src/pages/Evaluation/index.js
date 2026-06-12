import React, { useState, useEffect, useCallback } from "react";
import { getEssayListFromServer, setEssayList } from "../../store/tasks";
import 'react-quill/dist/quill.snow.css';
import { useNavigate } from "react-router-dom";
import { Table, Button, Tag, Card, Spin, Select, Statistic, Breadcrumb, Form, message } from "antd";
import { LeftOutlined } from '@ant-design/icons';
import ScoringPanel from "../../components/ScoringPanel";
import EvaluationPanel from "../../components/EvaluationPanel";
import { getPaperName } from '../../store/tasks';
import { submitEssayGrade } from "../../utils/exam";
import { isAuthError } from "../../utils";
import TaskTable from "../../components/Table/index.js";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
const { Countdown } = Statistic;

const Evaluation = () => {
  const [form] = Form.useForm();
  const { essayList, essayListTotal, paperName } = useSelector(state => state.tasks);
  const [papers, setPapers] = useState([]);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [gradeLoading, setGradeLoading] = useState(false);
  const [essayLoading, setEssayLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [flag, setFlag] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const [pageState, setPageState] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);

  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.user);
  const userId = userInfo?.userId || 7;

  const navigate = useNavigate()

  const handleChange = useCallback((page) => {
    setPageState(page);
  }, []);

  useEffect(() => {
    dispatch(getPaperName());
  }, [dispatch]);

  useEffect(() => {
    const loadEssayList = async () => {
      setEssayLoading(true);
      try {
        const result = await dispatch(getEssayListFromServer(userId, pageState, pageSize));
        if (result && result.dataList) {
          setTotal(result.total || 0);
          const transformedPapers = result.dataList.map(item => ({
            id: item.id,
            studentId: item.studentId,
            studentName: item.studentId,
            paperId: item.paperId,
            paperName: item.paperTitle || '无标题',
            questionId: item.questionId,
            score: item.score,
            review: item.review,
            status: item.score !== null && item.review ? '已阅' : '未阅',
            createTime: item.createTime,
            composition: [{
              questionId: item.questionId,
              studentAnswer: item.composition || '',
              score: item.score
            }]
          }));
          setPapers(transformedPapers);
        }
      } catch (error) {
        if (isAuthError(error)) {
          return;
        }
        message.error('获取作文列表失败');
      } finally {
        setEssayLoading(false);
      }
    };
    loadEssayList();
  }, [dispatch, userId, pageState, pageSize, refreshFlag]);

  const handleGradeSubmit = async (values) => {
    if (!currentPaper) {
      message.error('当前无选中的试卷，无法提交');
      return;
    }
    const score = values.score1 ?? values.score2 ?? values.score;
    const review = values.comment ?? values.review ?? '';
    const isEditingMode = values.isEditingMode ?? false;
    if (!isEditingMode && (score === undefined || score === null || score === '')) {
      message.warning('分数不能为空');
      return;
    }

    setGradeLoading(true);
    try {
      const updatedPapers = JSON.parse(JSON.stringify(papers));
      const paperIndex = updatedPapers.findIndex(p => p.id === currentPaper.id);
      if (paperIndex === -1) {
        message.error('未找到当前试卷数据');
        setGradeLoading(false);
        return;
      }

      const targetPaper = updatedPapers[paperIndex];
      targetPaper.score = Number(score);
      targetPaper.review = review || '';
      targetPaper.status = '已阅';

      setPapers(updatedPapers);
      setCurrentPaper({ ...targetPaper });

      if (!isEditingMode) {
        const submitAction = submitEssayGrade(currentPaper.id, score, review || '');
        await dispatch(submitAction);
      }

      setViewMode('list');

      message.success(isEditingMode ? '评价修改成功' : '评价提交成功');
      form.resetFields(['score', 'review']);
      setEditorContent('');
    } catch (error) {
      if (isAuthError(error)) {
        return;
      }
      console.error('提交/修改评价失败:', error);
      message.error(isEditingMode ? '修改失败：' + error.message : '提交失败：' + error.message);
    } finally {
      setGradeLoading(false);
    }
  };

  // 过滤待阅试卷
  const filterPendingPapers = () => {
    return papers.filter(paper => paper.status === '未阅');
  };

  return (
    <Spin spinning={gradeLoading || essayLoading}>
      {paperName.length > 0 && (
        <div style={{ padding: '24px', display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {viewMode === 'list' && (
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <Breadcrumb
                    style={{ marginBottom: 16 }}
                    items={[
                      {
                        title: '试卷批阅'
                      },
                    ]}
                  />
                  <TaskTable
                    papers={papers}
                    paperName={paperName}
                    handleChange={handleChange}
                    pageNow={pageState}
                    pageSize={pageSize}
                    filterPendingPapers={filterPendingPapers}
                    setEssayLoading={setEssayLoading}
                    setCurrentPaper={setCurrentPaper}
                    setViewMode={setViewMode}
                    setIsEditingMode={setIsEditingMode}
                  />
                </div>
              </Card>
            )}

            {viewMode === 'grade' && currentPaper && (
              <Card style={{ width: '100%', padding: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ position: 'relative' }}>
                    <Button
                      type="primary"
                      onClick={() => setViewMode('list')}
                      style={{ position: 'absolute', left: -40, top: -20 }}
                      icon={<LeftOutlined />}
                    />
                  </div>
                  <Card style={{ width: '100%' }}>
                    <EvaluationPanel
                      form={form}
                      editorContent={editorContent}
                      setEditorContent={setEditorContent}
                      onSubmit={handleGradeSubmit}
                      onCancel={() => setViewMode('list')}
                      isEditingMode={isEditingMode}
                      paperData={currentPaper}
                      answers={currentPaper.questions}
                    />
                  </Card>
                  <Card style={{ width: '100%' }}>
                    <ScoringPanel
                      form={form}
                      editorContent={editorContent}
                      setEditorContent={setEditorContent}
                      onSubmit={handleGradeSubmit}
                      onCancel={() => setViewMode('list')}
                      isEditingMode={isEditingMode}
                      paperData={currentPaper}
                    />
                  </Card>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </Spin>
  );
};

export default Evaluation;
