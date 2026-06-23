import './index.scss';
import AnswerLeft from '@/components/container/answerLeft';
import AnswerRight from '@/components/container/answerRight';
import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import stores from '@/stores';
import { getAnswerList, getComposition } from '@/api/studentAnswer';

export default function Answer() {
  const [loading, setLoading] = useState(true);
  const [hasResult, setHasResult] = useState(false);

  useEffect(() => {
    const paperId = stores.ExamStore.paperId;
    const studentId = stores.UserStore.userId;

    if (!paperId || !studentId) {
      setHasResult(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      getAnswerList(1, 100, { paperId, studentId }),
      getComposition(paperId),
    ])
      .then(([answerRes, compositionRes]: any[]) => {
        const answerItems = answerRes?.response?.pageResult?.items;
        const compositions = compositionRes?.response;
        const hasAnswers = Array.isArray(answerItems) && answerItems.length > 0;
        const hasCompositions = Array.isArray(compositions) && compositions.length > 0;
        setHasResult(hasAnswers || hasCompositions);
      })
      .catch(() => {
        setHasResult(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [stores.ExamStore.paperId, stores.UserStore.userId]);

  if (loading) {
    return (
      <div className="answerBox answerBox--loading">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!hasResult) {
    return (
      <div className="answerBox answerBox--empty">
        <p className="answerBox-empty-title">暂未出结果</p>
        <p className="answerBox-empty-desc">该试卷成绩尚未公布，请稍后再查看</p>
      </div>
    );
  }

  return (
    <div className="answerBox">
      <AnswerLeft />
      <AnswerRight />
    </div>
  );
}
