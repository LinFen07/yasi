import { request } from './request';

/** 成绩报告 API 封装 + read 响应防御式归一化
 *  列表: POST /api/teacher/examPaperAnswer/page
 *  详情: POST /api/teacher/examPaperAnswer/read/{id}  -> RestResponse<ExamPaperReadVM{paper, answer}>
 */

const SUCCESS_CODES = new Set([0, 1, 200]);

export function ensureSuccess(data, fallbackMessage) {
  if (!data || typeof data !== 'object') {
    throw new Error(fallbackMessage || '服务响应异常');
  }
  const code = data.code;
  if (code === undefined || code === null || code === '') return data;
  if (SUCCESS_CODES.has(Number(code))) return data;
  throw new Error(data.message || fallbackMessage || '请求失败');
}

export function stripHtmlTags(html) {
  if (html === null || html === undefined) return '';
  const text = String(html);
  if (!text) return '';
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return text.replace(/<[^>]*>/g, '');
  }
  try {
    const doc = new window.DOMParser().parseFromString(text, 'text/html');
    return (doc.body && doc.body.textContent ? doc.body.textContent : '').trim();
  } catch (e) {
    return text.replace(/<[^>]*>/g, '');
  }
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function pickArray(sources, keys) {
  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    if (!src || typeof src !== 'object') continue;
    for (let j = 0; j < keys.length; j++) {
      const value = src[keys[j]];
      if (Array.isArray(value) && value.length > 0) return value;
    
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const inner = pickArray([value], keys);
        if (inner) return inner;
      }
      if (typeof value === 'string' && value.charAt(0) === '[') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {

        }
      }
    }
  }
  return null;
}

/** 深度优先查找形如答题记录的数组（含 questionId 且含 isCorrect/studentAnswer 之一） */
function deepFindAnswerArray(root, depth) {
  if (!root || typeof root !== 'object' || depth > 4) return null;
  if (Array.isArray(root)) {
    const first = root[0];
    if (
      first &&
      typeof first === 'object' &&
      ('questionId' in first || 'questionNo' in first || 'questionNum' in first) &&
      ('studentAnswer' in first || 'isCorrect' in first || 'correctAnswer' in first || 'myAnswer' in first)
    ) {
      return root;
    }
    return null;
  }
  const keys = Object.keys(root);
  for (let i = 0; i < keys.length; i++) {
    const found = deepFindAnswerArray(root[keys[i]], depth + 1);
    if (found) return found;
  }
  return null;
}

const ITEM_KEYS = [
  'items', 'list', 'records', 'rows', 'answers', 'studentAnswers',
  'answerList', 'questionAnswers', 'answerItems', 'detailList',
];

const ARTICLE_KEYS = ['compositions', 'writings', 'writingList', 'writing', 'composition', 'essayList', 'essays'];

function normalizeArticle(raw, index) {
  if (typeof raw === 'string') {
    return { id: `composition-${index}`, composition: stripHtmlTags(raw), score: null, review: null };
  }
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: raw.id !== undefined && raw.id !== null ? raw.id : `composition-${index}`,
    composition:
      raw.composition || raw.content || raw.studentAnswer || raw.answer || raw.text || raw.essay || '',
    score: toNumberOrNull(raw.score !== undefined && raw.score !== null ? raw.score : raw.userScore),
    review: raw.review || raw.teacherReview || raw.comment || raw.remark || null,
  };
}

const MODULE_TYPE_MAP = { LISTENING: 1, READING: 2, WRITING: 3 };

function buildQuestionMap(paperInfo) {
  const map = {};
  const titleItems = Array.isArray(paperInfo.titleItems) ? paperInfo.titleItems : [];
  titleItems.forEach((titleItem) => {
    const questionItems = Array.isArray(titleItem && titleItem.questionItems)
      ? titleItem.questionItems
      : [];
    questionItems.forEach((question) => {
      if (question && question.id !== undefined && question.id !== null) {
        map[question.id] = question;
      }
    });
  });
  return map;
}

function toModuleType(value, fallback) {
  if (typeof value === 'string') {
    const mapped = MODULE_TYPE_MAP[value.toUpperCase()];
    if (mapped) return mapped;
  }
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function resolveStudentAnswer(row) {
  if (row.studentAnswer !== undefined && row.studentAnswer !== null && String(row.studentAnswer).trim() !== '') {
    return String(row.studentAnswer);
  }
  if (row.content !== undefined && row.content !== null && String(row.content).trim() !== '') {
    return String(row.content);
  }
  if (Array.isArray(row.contentArray)) {
    const parts = row.contentArray
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
      .map(String);
    if (parts.length) return parts.join(',');
  }
  if (row.myAnswer !== undefined && row.myAnswer !== null && String(row.myAnswer).trim() !== '') {
    return String(row.myAnswer);
  }
  return '';
}

function compareAnswer(mine, right) {
  const a = String(mine === null || mine === undefined ? '' : mine).trim().toUpperCase();
  const b = String(right === null || right === undefined ? '' : right).trim().toUpperCase();
  return a && b && a === b ? 1 : 0;
}

function normalizeAnswerRow(row, questionMap) {
  if (!row || typeof row !== 'object') return null;
  const question = questionMap[row.questionId] || {};
  const questionType =
    row.questionType !== undefined && row.questionType !== null
      ? row.questionType
      : question.questionType;
  const moduleType = toModuleType(row.moduleType, toModuleType(question.moduleType, null));
  const correctAnswer =
    row.correctAnswer !== undefined && row.correctAnswer !== null
      ? row.correctAnswer
      : question.correct != null
        ? question.correct
        : '';
  const studentAnswer = resolveStudentAnswer(row);

  let isCorrect = row.isCorrect;
  if (isCorrect === undefined || isCorrect === null) {
    if (row.doRight !== undefined && row.doRight !== null) {
      isCorrect = row.doRight === true || row.doRight === 1 || row.doRight === '1' ? 1 : 0;
    } else {
      isCorrect = compareAnswer(studentAnswer, correctAnswer);
    }
  }

  return {
    ...row,
    questionType,
    moduleType,
    correctAnswer,
    studentAnswer,
    isCorrect,
    score: toNumberOrNull(row.score) ?? 0,
  };
}

function isWritingRow(row) {
  return (
    Number(row.moduleType) === 3 ||
    Number(row.questionType) === 7 ||
    Number(row.isCorrect) === 2 ||
    Boolean(row.composition)
  );
}

function buildArticles(paperInfo, questionMap, writingRows) {
  const essayQuestions = [];
  const titleItems = Array.isArray(paperInfo.titleItems) ? paperInfo.titleItems : [];
  titleItems.forEach((titleItem) => {
    const questionItems = Array.isArray(titleItem && titleItem.questionItems)
      ? titleItem.questionItems
      : [];
    questionItems.forEach((question) => {
      if (
        question &&
        (Number(question.questionType) === 7 || Number(question.moduleType) === 3)
      ) {
        essayQuestions.push(question);
      }
    });
  });
  essayQuestions.sort((a, b) => (Number(a.itemOrder) || 0) - (Number(b.itemOrder) || 0));

  if (!essayQuestions.length && !writingRows.length) return null;

  const articles = [];
  const matchedRows = new Set();

  essayQuestions.forEach((question, index) => {
    const rows = writingRows.filter((row) => row.questionId === question.id);
    rows.forEach((row) => matchedRows.add(row));
    const composition = rows
      .map((row) => row.studentAnswer)
      .filter((text) => text && text !== '未作答')
      .join('\n');
    const scoredRows = rows.filter(
      (row) => row.score !== null && row.score !== undefined && row.score !== '',
    );
    articles.push({
      id: question.id !== undefined && question.id !== null ? question.id : `composition-${index}`,
      composition,
      score: scoredRows.length
        ? scoredRows.reduce((sum, row) => sum + (Number(row.score) || 0), 0)
        : null,
      review:
        rows.map((row) => row.review || row.teacherReview || row.comment).find(Boolean) || null,
      prompt: question.title || null,
    });
  });

  writingRows
    .filter((row) => !matchedRows.has(row))
    .forEach((row, index) => {
      articles.push({
        id: row.id !== undefined && row.id !== null ? row.id : `composition-${index}`,
        composition: row.composition || row.studentAnswer || '',
        score: toNumberOrNull(row.score !== undefined && row.score !== null ? row.score : row.userScore),
        review: row.review || row.teacherReview || row.comment || null,
        prompt: questionMap[row.questionId] ? questionMap[row.questionId].title || null : null,
      });
    });

  return articles;
}

export function normalizeReadResponse(payload) {
  const outer = payload && typeof payload === 'object' ? payload : {};
  const vm =
    outer.response && typeof outer.response === 'object' ? outer.response : outer;
  const rawPaper = vm.paper;
  const rawAnswer = vm.answer;

  const paperInfo =
    rawPaper && typeof rawPaper === 'object' && !Array.isArray(rawPaper) ? rawPaper : {};
  const answerInfo =
    rawAnswer && typeof rawAnswer === 'object' && !Array.isArray(rawAnswer) ? rawAnswer : {};
  const questionMap = buildQuestionMap(paperInfo);

  let rawItems = null;
  if (Array.isArray(rawAnswer) && rawAnswer.length > 0) {
    rawItems = rawAnswer;
  }
  if (!rawItems) {
    rawItems = pickArray([answerInfo, paperInfo, vm], ITEM_KEYS);
  }
  if (!rawItems) {
    const pageResult = answerInfo.pageResult || vm.pageResult || paperInfo.pageResult;
    rawItems = pickArray([pageResult], ITEM_KEYS);
  }
  if (!rawItems) {
    rawItems = deepFindAnswerArray(vm, 0);
  }
  if (!rawItems) rawItems = [];

  const normalized = rawItems
    .map((row) => normalizeAnswerRow(row, questionMap))
    .filter(Boolean);
  const writingRows = normalized.filter(isWritingRow);
  const items = normalized.filter((row) => !isWritingRow(row));

  let articles = pickArray([answerInfo, paperInfo, vm], ARTICLE_KEYS);
  if (articles && articles.length) {
    articles = articles.map(normalizeArticle).filter(Boolean);
  } else {
    articles = buildArticles(paperInfo, questionMap, writingRows) || [];
  }

  const scoreSource =
    answerInfo.studentPaperScore ||
    vm.studentPaperScore ||
    paperInfo.studentPaperScore ||
    answerInfo ||
    vm;
  const listening = toNumberOrNull(scoreSource.listeningScore ?? scoreSource.listening);
  const reading = toNumberOrNull(scoreSource.readingScore ?? scoreSource.reading);
  const moduleScores =
    listening === null && reading === null ? null : { listening, reading };

  return { items, articles, moduleScores, paperInfo, answerInfo };
}

export async function getAnswerPage(params = {}) {
  const payload = {
    pageIndex: params.pageIndex || 1,
    pageSize: params.pageSize || 10,
  };
  const optionalKeys = [
    'examPaperId', 'paperName', 'userName', 'subjectId', 'paperType',
    'status', 'startTime', 'endTime', 'userScoreMin', 'userScoreMax',
  ];
  optionalKeys.forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value;
    }
  });
  const res = await request.post('/api/teacher/examPaperAnswer/page', payload);
  const data = ensureSuccess(res.data, '查询成绩报告失败');
  const page = data.response && typeof data.response === 'object' ? data.response : {};
  const list = page.list || page.records || page.rows || page.items || [];
  const total = Number(page.total ?? page.counts ?? page.totalCount ?? 0) || 0;
  return {
    list: Array.isArray(list) ? list : [],
    total,
    pageIndex: Number(page.pageIndex ?? page.pageNum ?? payload.pageIndex),
    pageSize: Number(page.pageSize ?? payload.pageSize),
  };
}

export async function readAnswerReport(id) {
  const res = await request.post(`/api/teacher/examPaperAnswer/read/${id}`);
  const data = ensureSuccess(res.data, '获取成绩报告失败');
  return normalizeReadResponse(data);
}
