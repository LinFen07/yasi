import './detail.scss';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Spin, Table, Tabs, Tag, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LeftOutlined,
  MinusCircleOutlined,
  ReadOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { readAnswerReport } from '../../utils/scoreReport';
import {
  computeModuleStats,
  processAnswerItems,
} from '../../utils/processAnswerReport';

const MODULE_META = [
  { key: 'listen', label: '听力', icon: SoundOutlined },
  { key: 'read', label: '阅读', icon: ReadOutlined },
];

function sanitizeHtml(input) {
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
  } catch (e) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
}

const tableColumns = [
  {
    title: '题号',
    dataIndex: 'moduleNumber',
    width: 72,
    render: (num) => <strong>{num}</strong>,
  },
  {
    title: '正确答案',
    key: 'answer',
    render: (_, record) => {
      const html = sanitizeHtml(record.answer);
      return (
        <Tooltip
          title={<div dangerouslySetInnerHTML={{ __html: html }} />}
          placement="topLeft"
          mouseEnterDelay={0}
          styles={{ body: { maxWidth: 360, whiteSpace: 'normal', wordBreak: 'break-word' } }}
        >
          <div
            className="report-table-answer"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Tooltip>
      );
    },
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
    title: '考生答案',
    dataIndex: 'studentAnswer',
    render: (val) => <span className="report-table-mine">{val || '未作答'}</span>,
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

function ModuleStatsBar({ stats, displayScore }) {
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

function AnswerTable({ rows }) {
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

export default function ScoreReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const meta = location.state?.row || {};

  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [activeTab, setActiveTab] = useState('listen');
  const [loadError, setLoadError] = useState(null);
  const [moduleScores, setModuleScores] = useState({
    listening: null,
    reading: null,
  });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setTableData([]);
      setModuleScores({ listening: null, reading: null });
      setLoadError('no-paper');
      return;
    }

    setLoadError(null);
    setLoading(true);

    readAnswerReport(id)
      .then(({ items, moduleScores: scores }) => {
        setModuleScores(scores || { listening: null, reading: null });
        setTableData(processAnswerItems(items));
        setLoadError(items.length ? null : 'no-data');
      })
      .catch(() => {
        setTableData([]);
        setModuleScores({ listening: null, reading: null });
        setLoadError('fetch-failed');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const listenStats = useMemo(() => computeModuleStats(tableData, '听力'), [tableData]);
  const readStats = useMemo(() => computeModuleStats(tableData, '阅读'), [tableData]);
  const listenRows = useMemo(() => tableData.filter((r) => r.module === '听力'), [tableData]);
  const readRows = useMemo(() => tableData.filter((r) => r.module === '阅读'), [tableData]);

  const hasAnyResult = tableData.length > 0;

  const listenDisplayScore =
    moduleScores.listening !== null ? moduleScores.listening : listenStats.totalScore;
  const readDisplayScore =
    moduleScores.reading !== null ? moduleScores.reading : readStats.totalScore;

  const tabItems = [
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
  ];

  const backButton = (
    <div className="detail-toolbar">
      <Button icon={<LeftOutlined />} onClick={() => navigate('/app/report')}>
        返回成绩报告列表
      </Button>
      {meta.userName || meta.realName || meta.paperName ? (
        <div className="detail-toolbar-meta">
          {meta.userName || meta.realName ? (
            <span className="detail-toolbar-meta-item">
              <em>考生</em>
              {meta.realName || meta.userName}
            </span>
          ) : null}
          {meta.paperName ? (
            <span className="detail-toolbar-meta-item">
              <em>试卷</em>
              {meta.paperName}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (loading) {
    return (
      <div className="score-report-detail">
        {backButton}
        <div className="result-panel result-panel--loading">
          <Spin size="large" />
          <p>正在加载成绩报告…</p>
        </div>
      </div>
    );
  }

  if (!loading && loadError === 'no-paper') {
    return (
      <div className="score-report-detail">
        {backButton}
        <div className="result-panel result-panel--empty">
          <div className="result-panel-head">
            <span className="result-panel-badge">SCORE REPORT</span>
            <h1>成绩报告</h1>
          </div>
          <p className="result-empty-tip">
            缺少成绩报告标识，请返回成绩报告列表重新选择考生
          </p>
        </div>
      </div>
    );
  }

  if (!hasAnyResult) {
    return (
      <div className="score-report-detail">
        {backButton}
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
              ? '成绩加载失败，请稍后重新打开该成绩报告'
              : '暂无答题记录。若考生刚完成听力/阅读，请稍等片刻后刷新重试'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="score-report-detail">
      {backButton}
      <div className="result-panel result-panel--ready">
        <div className="result-panel-head">
          <span className="result-panel-badge">SCORE REPORT</span>
          <h1>成绩报告</h1>
          <p className="result-panel-subtitle">听力 · 阅读 分项成绩与答题详情</p>
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
        </div>

        <div className="report-tabs-wrap">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            destroyOnHidden={false}
          />
        </div>
      </div>
    </div>
  );
}
