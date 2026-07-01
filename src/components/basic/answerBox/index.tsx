import './index.scss';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Modal, Spin, Table, Tabs, Tag } from 'antd';
import type { TableProps, TabsProps } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  MinusCircleOutlined,
  ReadOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import stores from '@/stores';
import { stripHtmlTags } from '@/utils/browser/submitAnswer';
import {
  computeModuleStats,
  processAnswerItems,
  type ReportRow,
} from '@/utils/helper/processAnswerReport';
import {
  fetchReportWithRetry,
  persistReportPaperId,
  resolveReportPaperId,
} from '@/utils/helper/reportPaperId';

type ModuleScores = {
  listening: number | null;
  reading: number | null;
};

interface Article {
  id: number;
  composition: string;
  score: number | null;
  review: string | null;
}

const MODULE_META = [
  { key: 'listen', label: '听力', icon: SoundOutlined, module: '听力' as const },
  { key: 'read', label: '阅读', icon: ReadOutlined, module: '阅读' as const },
  { key: 'writte', label: '写作', icon: EditOutlined, module: null },
];

function sanitizeHtml(input: string) {
  if (!input) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    const allowedTags = new Set(['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'span']);
    const blockedTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta']);
    blockedTags.forEach((tag) => doc.querySelectorAll(tag).forEach((el) => el.remove()));
    doc.body.querySelectorAll('*').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (!allowedTags.has(tag)) {
        el.replaceWith(doc.createTextNode(el.textContent || ''));
        return;
      }
      Array.from(el.attributes).forEach((attr) => el.removeAttribute(attr.name));
    });
    return doc.body.innerHTML;
  } catch {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
}

const tableColumns: TableProps<ReportRow>['columns'] = [
  {
    title: '题号',
    dataIndex: 'moduleNumber',
    width: 72,
    render: (num) => <strong>{num}</strong>,
  },
  {
    title: '正确答案',
    key: 'answer',
    render: (_, record) => (
      <div
        className="report-table-answer"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(record.answer) }}
      />
    ),
  },
  {
    title: '作答情况',
    key: 'status',
    width: 100,
    render: (_, { isCorrect, studentAnswer }) => {
      if (studentAnswer === '未作答') {
        return <Tag icon={<MinusCircleOutlined />} color="default">未作答</Tag>;
      }
      return isCorrect === 1 ? (
        <Tag icon={<CheckCircleOutlined />} color="success">正确</Tag>
      ) : (
        <Tag icon={<CloseCircleOutlined />} color="error">错误</Tag>
      );
    },
  },
  {
    title: '我的答案',
    dataIndex: 'studentAnswer',
    render: (val) => <span className="report-table-mine">{val || '未作答'}</span>,
  },
  {
    title: '得分',
    dataIndex: 'score',
    width: 72,
    render: (score, record) =>
      record.isCorrect === 1 && Number(score) > 0 ? (
        <span className="report-table-score">+{score}</span>
      ) : (
        <span className="report-table-score report-table-score--empty">—</span>
      ),
  },
];

function ScoreCard({
  label,
  icon: Icon,
  score,
  hasScore,
  hasData = false,
  stats,
  pendingText = '待公布',
}: {
  label: string;
  icon: typeof SoundOutlined;
  score: number | null;
  hasScore: boolean;
  hasData?: boolean;
  stats?: { correctCount: number; total: number; footText?: string };
  pendingText?: string;
}) {
  return (
    <div className={`report-score-card ${hasScore ? 'report-score-card--scored' : 'report-score-card--pending'}`}>
      <div className="report-score-card-head">
        <span className="report-score-card-icon"><Icon /></span>
        <span className="report-score-card-label">{label}</span>
      </div>
      <div className="report-score-card-value">
        {hasScore && score !== null ? score.toFixed(1) : '--'}
      </div>
      <div className="report-score-card-foot">
        {stats?.footText ? (
          <span>{stats.footText}</span>
        ) : hasScore && stats ? (
          <span>正确 {stats.correctCount} / {stats.total} 题</span>
        ) : hasData ? (
          <span>已作答，{pendingText}</span>
        ) : (
          <span>{pendingText}</span>
        )}
      </div>
    </div>
  );
}

function ModuleStatsBar({
  stats,
  displayScore,
}: {
  stats: ReturnType<typeof computeModuleStats>;
  displayScore?: number | null;
}) {
  const score = displayScore !== undefined && displayScore !== null ? displayScore : stats.totalScore;
  const showScore = (displayScore !== undefined && displayScore !== null) || stats.hasScore;

  return (
    <div className="report-stats-bar">
      <div className="report-stat report-stat--correct">
        <CheckCircleOutlined />
        <span>正确 {stats.correctCount}</span>
      </div>
      <div className="report-stat report-stat--wrong">
        <CloseCircleOutlined />
        <span>错误 {stats.wrongCount}</span>
      </div>
      <div className="report-stat report-stat--empty">
        <MinusCircleOutlined />
        <span>未做 {stats.noAnswer}</span>
      </div>
      {showScore && (
        <div className="report-stat report-stat--score">
          <span>模块得分</span>
          <strong>{score.toFixed(1)}</strong>
        </div>
      )}
    </div>
  );
}

function AnswerTable({ rows }: { rows: ReportRow[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  return (
    <Table
      className="report-table"
      size="middle"
      columns={tableColumns}
      dataSource={rows}
      rowKey="key"
      pagination={{
        current: page,
        pageSize,
        total: rows.length,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '40'],
        onChange: (p, size) => {
          setPage(p);
          setPageSize(size || 10);
        },
      }}
    />
  );
}

function WritingPanel({ articles }: { articles: Article[] }) {
  const [modalArticle, setModalArticle] = useState<Article | null>(null);
  const scoredArticles = articles.filter((a) => a.score !== null && a.score !== undefined);
  const hasWritingScore = scoredArticles.length > 0;
  const writingTotal = hasWritingScore
    ? scoredArticles.reduce((sum, a) => sum + (Number(a.score) || 0), 0)
    : null;

  if (!articles.length) {
    return (
      <div className="report-writing-empty">
        <EditOutlined />
        <p>暂无作文提交记录</p>
      </div>
    );
  }

  return (
    <>
      {hasWritingScore && (
        <div className="report-writing-summary">
          写作总分：<strong>{writingTotal!.toFixed(1)}</strong>
          <span>（共 {scoredArticles.length} 篇已评分）</span>
        </div>
      )}
      <div className="report-writing-list">
        {articles.map((article, index) => (
          <article className="report-writing-card" key={article.id}>
            <div className="report-writing-card-head">
              <h3>Task {index + 1}</h3>
              {article.score !== null && article.score !== undefined ? (
                <span className="report-writing-score">{Number(article.score).toFixed(1)} 分</span>
              ) : (
                <span className="report-writing-score report-writing-score--pending">待评分</span>
              )}
            </div>
            <div className="report-writing-preview">{article.composition}</div>
            {article.review && (
              <p className="report-writing-review">
                评语：{stripHtmlTags(article.review)}
              </p>
            )}
            <Button type="link" onClick={() => setModalArticle(article)}>查看全文</Button>
          </article>
        ))}
      </div>
      <Modal
        title="作文详情"
        open={!!modalArticle}
        onCancel={() => setModalArticle(null)}
        footer={null}
        width={760}
      >
        {modalArticle && (
          <div className="report-writing-modal">
            <div className="report-writing-modal-body">{modalArticle.composition}</div>
            <div className="report-writing-modal-meta">
              <div>
                <span>得分</span>
                <strong>{modalArticle.score ?? '未评分'}</strong>
              </div>
              <div>
                <span>老师评价</span>
                <p>{stripHtmlTags(modalArticle.review ?? '') || '未评价'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function Answer() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<ReportRow[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState('listen');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moduleScores, setModuleScores] = useState<ModuleScores>({
    listening: null,
    reading: null,
  });

  const paperId = resolveReportPaperId(searchParams.get('id'));

  useEffect(() => {
    const studentId = stores.UserStore.userId;
    if (!paperId || !studentId) {
      setLoading(false);
      setTableData([]);
      setArticles([]);
      setModuleScores({ listening: null, reading: null });
      setLoadError(!paperId ? 'no-paper' : 'no-user');
      return;
    }

    persistReportPaperId(paperId);
    setLoadError(null);
    setLoading(true);

    fetchReportWithRetry(paperId, studentId)
      .then(({ answerRes, compositionRes, items }) => {
        const paperScore = answerRes?.response?.studentPaperScore;
        setModuleScores({
          listening:
            paperScore?.listeningScore !== undefined && paperScore?.listeningScore !== null
              ? Number(paperScore.listeningScore)
              : null,
          reading:
            paperScore?.readingScore !== undefined && paperScore?.readingScore !== null
              ? Number(paperScore.readingScore)
              : null,
        });
        setTableData(processAnswerItems(items));
        const compositions = compositionRes?.response;
        const compositionList = Array.isArray(compositions) ? compositions : [];
        setArticles(compositionList);
        if (!items.length && !compositionList.length) {
          setLoadError('no-data');
        } else {
          setLoadError(null);
        }
      })
      .catch(() => {
        setTableData([]);
        setArticles([]);
        setModuleScores({ listening: null, reading: null });
        setLoadError('fetch-failed');
      })
      .finally(() => setLoading(false));
  }, [paperId, stores.UserStore.userId]);

  const listenStats = useMemo(() => computeModuleStats(tableData, '听力'), [tableData]);
  const readStats = useMemo(() => computeModuleStats(tableData, '阅读'), [tableData]);
  const listenRows = useMemo(() => tableData.filter((r) => r.module === '听力'), [tableData]);
  const readRows = useMemo(() => tableData.filter((r) => r.module === '阅读'), [tableData]);

  const writingScored = articles.filter((a) => a.score !== null && a.score !== undefined);
  const writingScore = writingScored.length
    ? writingScored.reduce((s, a) => s + (Number(a.score) || 0), 0)
    : null;
  const hasWritingScore = writingScored.length > 0;

  const hasAnyResult = tableData.length > 0 || articles.length > 0;

  const listenDisplayScore =
    moduleScores.listening !== null ? moduleScores.listening : listenStats.totalScore;
  const readDisplayScore =
    moduleScores.reading !== null ? moduleScores.reading : readStats.totalScore;

  const tabItems: TabsProps['items'] = [
    {
      key: 'listen',
      label: (
        <span className="report-tab-label">
          <SoundOutlined /> 听力
          {(moduleScores.listening !== null || listenStats.hasScore) && (
            <em>{listenDisplayScore.toFixed(1)}</em>
          )}
        </span>
      ),
      children: (
        <div className="report-tab-panel">
          <ModuleStatsBar stats={listenStats} displayScore={moduleScores.listening} />
          <AnswerTable rows={listenRows} />
        </div>
      ),
    },
    {
      key: 'read',
      label: (
        <span className="report-tab-label">
          <ReadOutlined /> 阅读
          {(moduleScores.reading !== null || readStats.hasScore) && (
            <em>{readDisplayScore.toFixed(1)}</em>
          )}
        </span>
      ),
      children: (
        <div className="report-tab-panel">
          <ModuleStatsBar stats={readStats} displayScore={moduleScores.reading} />
          <AnswerTable rows={readRows} />
        </div>
      ),
    },
    {
      key: 'writte',
      label: (
        <span className="report-tab-label">
          <EditOutlined /> 写作
          {hasWritingScore && writingScore !== null && <em>{writingScore.toFixed(1)}</em>}
        </span>
      ),
      children: (
        <div className="report-tab-panel">
          <WritingPanel articles={articles} />
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="result-panel result-panel--loading">
        <Spin size="large" />
        <p>正在加载成绩报告…</p>
      </div>
    );
  }

  if (!loading && loadError === 'no-paper') {
    return (
      <div className="result-panel result-panel--empty">
        <div className="result-panel-head">
          <span className="result-panel-badge">SCORE REPORT</span>
          <h1>成绩报告</h1>
        </div>
        <p className="result-empty-tip">
          请从试卷中心点击对应试卷的「查看结果」进入成绩报告
        </p>
      </div>
    );
  }

  if (!hasAnyResult) {
    return (
      <div className="result-panel result-panel--empty">
        <div className="result-panel-head">
          <span className="result-panel-badge">SCORE REPORT</span>
          <h1>成绩报告</h1>
          <div className="result-panel-status">
            <ClockCircleOutlined />
            <span>{loadError === 'no-data' ? '暂无答题记录' : '成绩尚未公布'}</span>
          </div>
        </div>
        <div className="report-score-overview">
          {MODULE_META.map(({ key, label, icon: Icon }) => (
            <div className="report-score-card report-score-card--pending" key={key}>
              <div className="report-score-card-head">
                <span className="report-score-card-icon"><Icon /></span>
                <span className="report-score-card-label">{label}</span>
              </div>
              <div className="report-score-card-value">--</div>
              <div className="report-score-card-foot"><span>待公布</span></div>
            </div>
          ))}
        </div>
        <p className="result-empty-tip">
          {loadError === 'fetch-failed'
            ? '成绩加载失败，请稍后从试卷中心重新打开「查看结果」'
            : '暂无答题记录。若刚完成听力/阅读，请稍等片刻后刷新；也可从试卷中心重新进入查看结果'}
        </p>
      </div>
    );
  }

  return (
    <div className="result-panel result-panel--ready">
      <div className="result-panel-head">
        <span className="result-panel-badge">SCORE REPORT</span>
        <h1>成绩报告</h1>
        <p className="result-panel-subtitle">听力 · 阅读 · 写作 分项成绩与答题详情</p>
      </div>

      <div className="report-score-overview">
        <ScoreCard
          label="听力"
          icon={SoundOutlined}
          score={
            moduleScores.listening !== null
              ? moduleScores.listening
              : listenStats.hasScore
                ? listenStats.totalScore
                : null
          }
          hasScore={moduleScores.listening !== null || listenStats.hasScore}
          hasData={listenStats.hasData}
          stats={{ correctCount: listenStats.correctCount, total: listenStats.total }}
          pendingText="待评分"
        />
        <ScoreCard
          label="阅读"
          icon={ReadOutlined}
          score={
            moduleScores.reading !== null
              ? moduleScores.reading
              : readStats.hasScore
                ? readStats.totalScore
                : null
          }
          hasScore={moduleScores.reading !== null || readStats.hasScore}
          hasData={readStats.hasData}
          stats={{ correctCount: readStats.correctCount, total: readStats.total }}
          pendingText="待评分"
        />
        <ScoreCard
          label="写作"
          icon={EditOutlined}
          score={writingScore}
          hasScore={hasWritingScore}
          hasData={articles.length > 0}
          pendingText="待评分"
          stats={
            articles.length
              ? {
                  correctCount: writingScored.length,
                  total: articles.length,
                  footText: hasWritingScore
                    ? `${writingScored.length} / ${articles.length} 篇已评分`
                    : `${articles.length} 篇已提交`,
                }
              : undefined
          }
        />
      </div>

      <div className="report-tabs-wrap">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          destroyInactiveTabPane={false}
        />
      </div>
    </div>
  );
}
