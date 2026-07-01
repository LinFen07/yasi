import React, { useState, useEffect, useCallback } from "react";
import { getEssayListFromServer, getJudgeStatsFromServer } from "../../store/tasks";
import 'react-quill/dist/quill.snow.css';
import { Button, Spin, message } from "antd";
import { LeftOutlined } from '@ant-design/icons';
import ScoringPanel from "../../components/ScoringPanel";
import EvaluationPanel from "../../components/EvaluationPanel";
import { getPaperName } from '../../store/tasks';
import { submitEssayGrade } from "../../utils/exam";
import { isAuthError, getToken } from "../../utils";
import TaskTable from "../../components/Table/index.js";
import { useDispatch, useSelector } from "react-redux";
import { Form } from "antd";
import './index.scss';

const Evaluation = () => {
  const [form] = Form.useForm();
  const { paperName } = useSelector(state => state.tasks);
  const [papers, setPapers] = useState([]);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [gradeLoading, setGradeLoading] = useState(false);
  const [essayLoading, setEssayLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);

  const [pageState, setPageState] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [gradedTotal, setGradedTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [searchFilters, setSearchFilters] = useState({ paperName: '', studentName: '', status: '' });

  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.user);
  const userId = userInfo?.id || userInfo?.userId || localStorage.getItem('userId');

  useEffect(() => {
    if (viewMode !== 'grade' || !currentPaper) {
      return;
    }
    form.setFieldsValue({
      score1: currentPaper.score ?? undefined,
      score2: currentPaper.score ?? undefined,
      comment: currentPaper.review || ''
    });
    setEditorContent(currentPaper.review || '');
  }, [viewMode, currentPaper, form]);

  const handleChange = useCallback((page) => {
    setPageState(page);
  }, []);

  const handleSearch = useCallback((paperName, studentName, status) => {
    setPageState(1);
    setSearchFilters({
      paperName: paperName || '',
      studentName: studentName || '',
      status: status || ''
    });
  }, []);

  useEffect(() => {
    dispatch(getPaperName());
  }, [dispatch]);

  useEffect(() => {
    if (!getToken() || !userId) {
      return undefined;
    }

    let cancelled = false;

    const loadEssayList = async () => {
      setEssayLoading(true);
      try {
        const [result, stats] = await Promise.all([
          dispatch(getEssayListFromServer(userId, pageState, pageSize, searchFilters)),
          dispatch(getJudgeStatsFromServer(userId))
        ]);
        if (cancelled) {
          return;
        }
        if (stats) {
          setGradedTotal(stats.graded || 0);
          setPendingTotal(stats.pending || 0);
        }
        if (result && result.dataList) {
          setTotal(result.total || 0);
          const transformedPapers = result.dataList.map(item => ({
            id: item.id,
            studentId: item.studentId,
            studentName: item.userName || item.realName || item.studentName || '未知',
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
        if (cancelled || isAuthError(error) || !getToken()) {
          return;
        }
        message.error('获取作文列表失败');
      } finally {
        if (!cancelled) {
          setEssayLoading(false);
        }
      }
    };
    loadEssayList();

    return () => {
      cancelled = true;
    };
  }, [dispatch, userId, pageState, pageSize, refreshFlag, searchFilters]);

  const handleGradeSubmit = async (values) => {
    if (!currentPaper) {
      message.error('当前无选中的试卷，无法提交');
      return;
    }
    const score = values.score1 ?? values.score2 ?? values.score;
    const review = values.comment ?? values.review ?? editorContent ?? '';
    const editing = isEditingMode;
    if (score === undefined || score === null || score === '') {
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

      const submitAction = submitEssayGrade(currentPaper.id, score, review || '');
      await dispatch(submitAction);

      setViewMode('list');
      message.success(editing ? '评价修改成功' : '评价提交成功');
      form.resetFields(['score1', 'score2', 'comment']);
      setEditorContent('');
      setIsEditingMode(false);
      setRefreshFlag(prev => !prev);
    } catch (error) {
      if (isAuthError(error)) {
        return;
      }
      message.error(editing ? '修改失败：' + error.message : '提交失败：' + error.message);
    } finally {
      setGradeLoading(false);
    }
  };

  if (!paperName.length) {
    return null;
  }

  return (
    <Spin spinning={gradeLoading || essayLoading}>
      <div className="evaluation-page">
        {viewMode === 'list' && (
          <>
            <div className="evaluation-page__header">
              <div>
                <h1 className="evaluation-page__title">试卷批阅</h1>
                <p className="evaluation-page__desc">查看并评阅考生提交的模考作文</p>
              </div>
              <div className="evaluation-page__stats">
                <span className="evaluation-page__stat evaluation-page__stat--graded">
                  已批阅数量 <strong>{gradedTotal}</strong>
                </span>
                <span className="evaluation-page__stat evaluation-page__stat--pending">
                  待评阅 <strong>{pendingTotal}</strong>
                </span>
              </div>
            </div>

            <div className="evaluation-page__panel">
              <TaskTable
                papers={papers}
                paperName={paperName}
                handleChange={handleChange}
                pageNow={pageState}
                pageSize={pageSize}
                total={total}
                onSearch={handleSearch}
                setEssayLoading={setEssayLoading}
                setCurrentPaper={setCurrentPaper}
                setViewMode={setViewMode}
                setIsEditingMode={setIsEditingMode}
              />
            </div>
          </>
        )}

        {viewMode === 'grade' && currentPaper && (
          <div className="evaluation-page__grade">
            <Button
              className="evaluation-page__back"
              type="default"
              icon={<LeftOutlined />}
              onClick={() => setViewMode('list')}
            >
              返回列表
            </Button>
            <Form form={form} onFinish={handleGradeSubmit} layout="vertical">
              <div className="evaluation-page__grade-panel">
                <ScoringPanel paperData={currentPaper} />
              </div>
              <div className="evaluation-page__grade-panel">
                <EvaluationPanel
                  editorContent={editorContent}
                  setEditorContent={setEditorContent}
                  isEditingMode={isEditingMode}
                  paperData={currentPaper}
                />
              </div>
            </Form>
          </div>
        )}
      </div>
    </Spin>
  );
};

export default Evaluation;
