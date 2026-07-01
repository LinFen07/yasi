export type ReportRow = {
  key: string;
  moduleNumber: number;
  module: '听力' | '阅读';
  answer: string;
  isCorrect: number;
  studentAnswer: string;
  score: number;
};

const LISTEN_QUESTION_COUNT = 40;
const READ_QUESTION_COUNT = 40;
const DUAL_SELECT_TYPES = new Set([2, 5]);
const MULTI_SLOT_TYPES = new Set([4, 6]); // 填空、拖拽：一题多空

/** API 分数为十分位（5 → 0.5 分） */
function apiScore(value: unknown) {
  const n = Number(value);
  if (!n) return 0;
  return n / 10;
}

function normalizeAnswer(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function splitOptions(value: unknown): string[] {
  const normalized = normalizeAnswer(value);
  if (!normalized) return [];
  return normalized
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function pushSubItem(
  allSubItems: any[],
  item: any,
  overrides: Partial<any> & { subKey: string }
) {
  allSubItems.push({
    ...item,
    studentAnswer: normalizeAnswer(overrides.studentAnswer ?? item.studentAnswer) || '未作答',
    correctAnswer: overrides.correctAnswer ?? item.correctAnswer,
    isCorrect: overrides.isCorrect ?? item.isCorrect,
    score: overrides.score ?? apiScore(item.score) ?? 0,
    subKey: overrides.subKey,
  });
}

function isDualSelectQuestion(item: any, group: any[]) {
  if (DUAL_SELECT_TYPES.has(Number(item.questionType))) return true;
  return collectCorrectOptions(group, item).length > 1;
}

/** 从分组记录中汇总考生选项（逗号合并 + 多条 prefix 记录） */
function collectStudentOptions(group: any[]): string[] {
  const options: string[] = [];
  for (const row of group) {
    splitOptions(row.studentAnswer).forEach((opt) => {
      if (opt && !options.includes(opt)) options.push(opt);
    });
  }
  return options;
}

function collectCorrectOptions(group: any[], item: any): string[] {
  if (group.length >= 2) {
    const perRow = group
      .map((row) => normalizeAnswer(row.correctAnswer))
      .filter(Boolean);
    const allSingleLetter = perRow.every((ans) => ans.length === 1 && !ans.includes(','));
    if (allSingleLetter && perRow.length > 1) {
      return perRow;
    }
  }
  return splitOptions(item.correctAnswer);
}

function resolveSlotScore(group: any[], item: any, correctOptions: string[], isCorrect: number, optIdx: number) {
  if (isCorrect !== 1) return 0;
  const prefixRow = group[optIdx];
  if (prefixRow && Number(prefixRow.score) > 0) {
    return apiScore(prefixRow.score);
  }
  const totalScore =
    group.reduce((sum, row) => sum + apiScore(row.score), 0) || apiScore(item.score);
  return correctOptions.length ? totalScore / correctOptions.length : totalScore;
}

/** 双选题：按选项集合匹配（不依赖顺序） */
function expandDualSelect(item: any, group: any[]) {
  const studentOptions = collectStudentOptions(group);
  const correctOptions = collectCorrectOptions(group, item);

  if (correctOptions.length <= 1) {
    const studentAnswer = studentOptions[0] || normalizeAnswer(item.studentAnswer) || '未作答';
    const correctAnswer = correctOptions[0] || normalizeAnswer(item.correctAnswer);
    const isCorrect =
      studentAnswer !== '未作答' &&
      studentAnswer.toUpperCase() === correctAnswer.toUpperCase()
        ? 1
        : 0;
    return [
      {
        ...item,
        studentAnswer,
        correctAnswer,
        isCorrect,
        score: isCorrect === 1 ? apiScore(item.score) : 0,
        subKey: `${item.questionId}-${item.prefix || ''}`,
      },
    ];
  }

  const usedStudentIdx = new Set<number>();

  return correctOptions.map((correctOpt, optIdx) => {
    let studentOpt = '未作答';
    let isOptionCorrect = 0;

    const matchIdx = studentOptions.findIndex(
      (opt, idx) =>
        opt.toUpperCase() === correctOpt.toUpperCase() && !usedStudentIdx.has(idx)
    );
    if (matchIdx >= 0) {
      usedStudentIdx.add(matchIdx);
      studentOpt = correctOpt;
      isOptionCorrect = 1;
    } else {
      const wrongIdx = studentOptions.findIndex(
        (opt, idx) => !usedStudentIdx.has(idx) && !correctOptions.includes(opt)
      );
      if (wrongIdx >= 0) {
        usedStudentIdx.add(wrongIdx);
        studentOpt = studentOptions[wrongIdx];
      } else {
        const leftoverIdx = studentOptions.findIndex((_, idx) => !usedStudentIdx.has(idx));
        if (leftoverIdx >= 0) {
          usedStudentIdx.add(leftoverIdx);
          studentOpt = studentOptions[leftoverIdx];
          isOptionCorrect = studentOpt === correctOpt ? 1 : 0;
        }
      }
    }

    const prefix = group[optIdx]?.prefix ?? `${optIdx + 1}`;

    return {
      ...item,
      studentAnswer: studentOpt,
      correctAnswer: correctOpt,
      isCorrect: isOptionCorrect,
      score: resolveSlotScore(group, item, correctOptions, isOptionCorrect, optIdx),
      subKey: `${item.questionId}-${prefix}-${optIdx}`,
    };
  });
}

/** prefix 分组：每条记录对应一个空，按内容判对错 */
function expandDualSelectPrefixGroup(group: any[], correctOptions: string[]) {
  return group.map((subItem, idx) => {
    const studentAnswer = normalizeAnswer(subItem.studentAnswer);
    const correctAnswer =
      normalizeAnswer(subItem.correctAnswer) || correctOptions[idx] || '';
    const isCorrect =
      studentAnswer &&
      correctAnswer &&
      studentAnswer.toUpperCase() === correctAnswer.toUpperCase()
        ? 1
        : 0;

    return {
      ...subItem,
      studentAnswer: studentAnswer || '未作答',
      correctAnswer,
      isCorrect,
      score: resolveSlotScore(group, subItem, correctOptions, isCorrect, idx),
      subKey: `${subItem.questionId}-${subItem.prefix || idx}`,
    };
  });
}

function comparePrefix(a: any, b: any) {
  const pa = a.prefix !== undefined && a.prefix !== null && a.prefix !== '' ? Number(a.prefix) : 0;
  const pb = b.prefix !== undefined && b.prefix !== null && b.prefix !== '' ? Number(b.prefix) : 0;
  return pa - pb;
}

/** 填空/拖拽：按 prefix 每空一行；兼容旧数据把多空答案合并到第一行的情况 */
function expandMultiSlotGroup(group: any[]) {
  const sorted = [...group].sort(comparePrefix);
  const firstStudent = normalizeAnswer(sorted[0]?.studentAnswer);
  const restEmpty = sorted.slice(1).every((row) => !normalizeAnswer(row.studentAnswer));
  const commaParts = firstStudent.includes(',') ? splitOptions(firstStudent) : [];

  if (restEmpty && commaParts.length > 1) {
    return sorted.map((row, idx) => {
      const studentAnswer = commaParts[idx] || '未作答';
      const correctAnswer = normalizeAnswer(row.correctAnswer);
      const isCorrect =
        row.isCorrect !== undefined && row.isCorrect !== null
          ? Number(row.isCorrect)
          : studentAnswer !== '未作答' &&
              correctAnswer &&
              studentAnswer.toUpperCase() === correctAnswer.toUpperCase()
            ? 1
            : 0;

      return {
        ...row,
        studentAnswer,
        correctAnswer,
        isCorrect,
        score: isCorrect === 1 ? apiScore(row.score) : 0,
        subKey: `${row.questionId}-${row.prefix ?? idx}`,
      };
    });
  }

  return sorted.map((row, idx) => {
    const studentAnswer = normalizeAnswer(row.studentAnswer);
    const correctAnswer = normalizeAnswer(row.correctAnswer);
    const isCorrect =
      row.isCorrect !== undefined && row.isCorrect !== null
        ? Number(row.isCorrect)
        : studentAnswer &&
            correctAnswer &&
            studentAnswer.toUpperCase() === correctAnswer.toUpperCase()
          ? 1
          : 0;

    return {
      ...row,
      studentAnswer: studentAnswer || '未作答',
      correctAnswer,
      isCorrect,
      score: isCorrect === 1 ? apiScore(row.score) : 0,
      subKey: `${row.questionId}-${row.prefix ?? idx}`,
    };
  });
}

/** 仅一条记录但 studentAnswer 含多个逗号分隔值（旧版错误合并提交） */
function expandSingleMergedGapRow(item: any) {
  const studentParts = splitOptions(item.studentAnswer);
  const correctParts = splitOptions(item.correctAnswer);
  if (studentParts.length <= 1 && correctParts.length <= 1) {
    return [
      {
        ...item,
        studentAnswer: studentParts[0] || '未作答',
        correctAnswer: correctParts[0] || normalizeAnswer(item.correctAnswer),
        isCorrect: Number(item.isCorrect) || 0,
        score: apiScore(item.score),
        subKey: `${item.questionId}-${item.prefix || ''}`,
      },
    ];
  }
  const slotCount = Math.max(studentParts.length, correctParts.length, 1);
  return Array.from({ length: slotCount }, (_, idx) => {
    const studentAnswer = studentParts[idx] || '未作答';
    const correctAnswer = correctParts[idx] || '';
    const isCorrect =
      studentAnswer !== '未作答' &&
      correctAnswer &&
      studentAnswer.toUpperCase() === correctAnswer.toUpperCase()
        ? 1
        : 0;
    return {
      ...item,
      studentAnswer,
      correctAnswer,
      isCorrect,
      score: isCorrect === 1 ? apiScore(item.score) / slotCount : 0,
      subKey: `${item.questionId}-${item.prefix || ''}-${idx}`,
    };
  });
}

function shouldUsePrefixGroupExpand(group: any[], correctOptions: string[]) {
  if (group.length < 2 || group.length < correctOptions.length) return false;
  const hasPrefix = group.every(
    (row) => row.prefix !== undefined && row.prefix !== null && String(row.prefix).trim() !== ''
  );
  if (!hasPrefix) return false;
  const perRowStudent = group.map((row) => normalizeAnswer(row.studentAnswer)).filter(Boolean);
  const perRowCorrect = group.map((row) => normalizeAnswer(row.correctAnswer)).filter(Boolean);
  return perRowStudent.length === group.length && perRowCorrect.length >= correctOptions.length;
}

export function processAnswerItems(items: any[]): ReportRow[] {
  if (!items.length) return [];

  const groupedByQuestion: Record<number, any[]> = {};
  for (const item of items) {
    if (!groupedByQuestion[item.questionId]) groupedByQuestion[item.questionId] = [];
    groupedByQuestion[item.questionId].push(item);
  }
  for (const qid in groupedByQuestion) {
    groupedByQuestion[qid].sort((a, b) => {
      const pa = a.prefix !== undefined && a.prefix !== null && a.prefix !== '' ? Number(a.prefix) : 0;
      const pb = b.prefix !== undefined && b.prefix !== null && b.prefix !== '' ? Number(b.prefix) : 0;
      return pa - pb;
    });
  }

  const seenQids = new Set<number>();
  const sortedItems: any[] = [];
  for (const item of items) {
    if (!seenQids.has(item.questionId)) {
      seenQids.add(item.questionId);
      sortedItems.push(...(groupedByQuestion[item.questionId] || []));
    }
  }

  const allSubItems: any[] = [];
  const processedQuestionIds = new Set<number>();

  for (const item of sortedItems) {
    const group = groupedByQuestion[item.questionId] || [item];

    if (processedQuestionIds.has(item.questionId)) continue;
    processedQuestionIds.add(item.questionId);

    const qType = Number(item.questionType);

    if (MULTI_SLOT_TYPES.has(qType)) {
      if (group.length > 1) {
        allSubItems.push(...expandMultiSlotGroup(group));
      } else {
        allSubItems.push(...expandSingleMergedGapRow(item));
      }
      continue;
    }

    if (isDualSelectQuestion(item, group)) {
      const correctOptions = collectCorrectOptions(group, item);

      if (shouldUsePrefixGroupExpand(group, correctOptions)) {
        allSubItems.push(...expandDualSelectPrefixGroup(group, correctOptions));
      } else {
        allSubItems.push(...expandDualSelect(item, group));
      }
      continue;
    }

    for (const row of group) {
      pushSubItem(allSubItems, row, {
        subKey: `${row.questionId}-${row.prefix || ''}`,
        isCorrect:
          normalizeAnswer(row.studentAnswer) &&
          normalizeAnswer(row.correctAnswer) &&
          normalizeAnswer(row.studentAnswer).toUpperCase() ===
            normalizeAnswer(row.correctAnswer).toUpperCase()
            ? 1
            : Number(row.isCorrect) || 0,
      });
    }
  }

  const listenReadItems = allSubItems.slice(0, LISTEN_QUESTION_COUNT + READ_QUESTION_COUNT);
  const finalData: ReportRow[] = [];
  const moduleCounter = { 听力: 0, 阅读: 0 };

  listenReadItems.forEach((item, idx) => {
    const module: '听力' | '阅读' = idx < LISTEN_QUESTION_COUNT ? '听力' : '阅读';
    moduleCounter[module]++;
    finalData.push({
      key: `${item.subKey}-${moduleCounter[module]}`,
      moduleNumber: moduleCounter[module],
      module,
      answer: item.correctAnswer,
      isCorrect: item.isCorrect,
      studentAnswer: item.studentAnswer,
      score: item.score,
    });
  });

  return finalData;
}

export function computeModuleStats(rows: ReportRow[], module: '听力' | '阅读') {
  const filtered = rows.filter((row) => row.module === module);
  let correctCount = 0;
  let wrongCount = 0;
  let noAnswer = 0;
  let totalScore = 0;

  filtered.forEach((item) => {
    if (item.studentAnswer === '未作答') {
      noAnswer++;
    } else if (item.isCorrect === 1) {
      correctCount++;
      totalScore += Number(item.score) || 0;
    } else {
      wrongCount++;
    }
  });

  return {
    total: filtered.length,
    correctCount,
    wrongCount,
    noAnswer,
    totalScore,
    hasData: filtered.length > 0,
    hasScore: filtered.some((item) => Number(item.score) > 0),
  };
}
