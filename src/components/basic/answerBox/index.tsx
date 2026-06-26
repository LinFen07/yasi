import './index.scss';
import AnswerLeft from '@/components/container/answerLeft';
import AnswerRight from '@/components/container/answerRight';
import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import {
  ClockCircleOutlined,
  EditOutlined,
  ReadOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import stores from '@/stores';
import { getAnswerList, getComposition } from '@/api/studentAnswer';

const SUBJECT_CARDS = [
  { key: 'listen', label: '听力', icon: SoundOutlined },
  { key: 'read', label: '阅读', icon: ReadOutlined },
  { key: 'writte', label: '写作', icon: EditOutlined },
] as const;

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
      <div className="result-panel result-panel--loading">
        <Spin size="large" />
        <p>正在加载成绩报告…</p>
      </div>
    );
  }

  if (!hasResult) {
    return (
      <div className="result-panel result-panel--empty">
        <div className="result-panel-head">
          <span className="result-panel-badge">SCORE REPORT</span>
          <h1>成绩报告</h1>
          <div className="result-panel-status">
            <ClockCircleOutlined />
            <span>成绩尚未公布</span>
          </div>
        </div>

        <div className="result-score-cards">
          {SUBJECT_CARDS.map(({ key, label, icon: Icon }) => (
            <div className="result-score-card result-score-card--pending" key={key}>
              <div className="result-score-card-top">
                <Icon />
                <span>{label}</span>
              </div>
              <div className="result-score-card-value">--</div>
              <div className="result-score-card-label">待公布</div>
            </div>
          ))}
        </div>

        <p className="result-empty-tip">
          该试卷成绩尚未公布，公布后将在此展示听力、阅读、写作得分与答题详情
        </p>
      </div>
    );
  }

  return (
    <div className="result-panel result-panel--ready">
      <div className="result-panel-head result-panel-head--compact">
        <span className="result-panel-badge">SCORE REPORT</span>
        <h1>成绩报告</h1>
      </div>
      <div className="answerBox">
        <AnswerLeft />
        <AnswerRight />
      </div>
    </div>
  );
}
