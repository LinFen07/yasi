import { useEffect, useMemo, useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ExamType, Exam, Items } from "@/typings/exam";
import TurndownService from 'turndown';
import parse from 'html-react-parser';
import './index.scss';
import stores from '@/stores';
import { computedPrevCount, getQuestionSlotCount } from '@/utils/helper/computed';
import { runInAction } from 'mobx';
import { stripHtmlTags, submitStudentBlankAnswer } from '@/utils/browser/submitAnswer';

interface DragOption {
  option: string;
  originalIndex: number;
  letter: string;
}

interface SlotAssignment {
  questionIndex: number;
  option: string;
  originalIndex: number;
}

interface DropTargetProps {
  questionIndex: number;
  onDrop: (item: { option: string; index: number }, questionIndex: number) => void;
  onRemove: (questionIndex: number) => void;
  assignedOption?: string;
}

const turndownService = new TurndownService();
const ItemTypes = {
  OPTION: 'option',
};

function formatDragOption(item: Items) {
  const prefix = (item.prefix || '').trim();
  const content = stripHtmlTags(item.content || '').trim();
  if (prefix && content) return `${prefix}. ${content}`;
  return prefix || content;
}

function parseTitleMetaFromMarkdown(markdown: string) {
  const lines = markdown.split('\n').map(line => line.trim()).filter(Boolean);

  const optionRegex = /^([A-Z])[.)]\s+(.+)$/;
  const questionRegex = /^\*\*(\d+)\*\*\s*(.*)$|^(\d+)[.)]?\s*(.+)$/;

  const Options: DragOption[] = [];
  const Questions: string[] = [];
  const instructionLines: string[] = [];
  let optionTitle = '';
  let title = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const optionMatch = line.match(optionRegex);
    const questionMatch = line.match(questionRegex);

    if (optionMatch) {
      const prefix = optionMatch[1] || optionMatch[3];
      const text = optionMatch[2] || optionMatch[4] || '';
      Options.push({
        option: `${prefix} ${text}`.trim(),
        originalIndex: Options.length,
        letter: prefix,
      });
    } else if (questionMatch) {
      const text = (questionMatch[2] || questionMatch[4] || '').replace(/\s*\d+\s*$/, '').trim();
      if (text) Questions.push(text);
    } else {
      const cleanedLine = line.replace(/\*\*/g, '');
      instructionLines.push(cleanedLine);
    }
  }

  const questionTitle = instructionLines.join('\n');

  return { questionTitle, Questions, Options, optionTitle, title };
}

function buildDragQuestionData(questionArr: ExamType) {
  const items = questionArr.items || [];
  const promptItems = items.filter(item => item.itemUuid === 'prompt');
  const optionItems = items.filter(item => item.itemUuid !== 'prompt').sort((a, b) => +a.prefix - +b.prefix);

  const markdown = turndownService.turndown(questionArr.title || '');
  const titleMeta = parseTitleMetaFromMarkdown(markdown);

  let Options: DragOption[] = optionItems.map((item, index) => ({
    option: formatDragOption(item),
    originalIndex: index,
    letter: (item.prefix || '').trim().charAt(0),
  }));

  let Questions: string[] = promptItems.map(item => {
    const describe = item.describe ? stripHtmlTags(item.describe).trim() : '';
    if (describe) return describe;
    return stripHtmlTags(item.content || '').trim() || item.prefix || '';
  }).filter(Boolean);

  if (Options.length === 0) {
    Options = titleMeta.Options;
  }
  if (Questions.length === 0) {
    Questions = titleMeta.Questions;
  }

  return {
    questionTitle: titleMeta.questionTitle,
    optionTitle: titleMeta.optionTitle,
    title: titleMeta.title,
    Options,
    Questions,
    promptItems,
    allowOptionReuse: Questions.length > Options.length,
  };
}

function matchSavedOption(savedAnswer: string, options: DragOption[]) {
  return options.find(
    (opt) =>
      opt.option === savedAnswer ||
      opt.letter === savedAnswer ||
      savedAnswer.startsWith(`${opt.letter} `)
  );
}

const Option = ({ option, index }: { option: string; index: number }) => {
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: ItemTypes.OPTION,
      item: { option, index },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [option, index]
  );

  return (
    <div ref={preview} className='drag-question-option'>
      <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}>
        {option}
      </div>
    </div>
  );
};

const DropTarget = ({ questionIndex, onDrop, onRemove, assignedOption }: DropTargetProps) => {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.OPTION,
    drop: (item: { option: string; index: number }) => onDrop(item, questionIndex)
  }));

  return (
    <div ref={drop} className='drag-question-dragItem'>
      {assignedOption ? (
        <div
          className="drag-question-dragItem-filled"
          onClick={() => onRemove(questionIndex)}
          title="点击清除"
        >
          {assignedOption}
        </div>
      ) : null}
    </div>
  );
};

export default function DragQuestion(questionArr: ExamType & { exam?: Exam[] }) {
  const parsed = useMemo(
    () => buildDragQuestionData(questionArr),
    [questionArr.id, questionArr.title, questionArr.items]
  );
  const { questionTitle, Questions, Options, optionTitle, title, promptItems, allowOptionReuse } = parsed;

  // ========== 核心修改：统一计算起始题号 ==========
  const exam = questionArr.exam || [];
  const currentTitle = stores.ExamStore.currentExamTitle;
  const partIndex = +currentTitle[4] - 1;
  const part = exam[partIndex];
  const questionItems = part?.questionItems || [];
  const currentIndex = questionItems.findIndex(item => item.id === questionArr.id);
  // 当前 part 之前的题号总数
  const prevCount = computedPrevCount(currentTitle, exam);
  // 当前题组之前的题号数（在本 part 内）
  const beforeCount = questionItems.slice(0, currentIndex).reduce((acc, q) => acc + getQuestionSlotCount(q), 0);
  // 该题组起始题号减 1
  const dragPrevCount = prevCount + beforeCount;

  const getGlobalIndex = (questionIndex: number) => dragPrevCount + questionIndex;

  const [availableOptions, setAvailableOptions] = useState<DragOption[]>(Options);
  const [slotAssignments, setSlotAssignments] = useState<SlotAssignment[]>([]);

  // 使用 ref 保存当前状态，避免异步问题
  const slotAssignmentsRef = useRef<SlotAssignment[]>([]);
  const availableOptionsRef = useRef<DragOption[]>(Options);

  useEffect(() => {
    slotAssignmentsRef.current = slotAssignments;
  }, [slotAssignments]);

  useEffect(() => {
    availableOptionsRef.current = availableOptions;
  }, [availableOptions]);

  useEffect(() => {
    const initialAssignments: SlotAssignment[] = [];
    const usedOptionIndexes = new Set<number>();

    Questions.forEach((_, questionIndex) => {
      const globalIndex = getGlobalIndex(questionIndex);
      const completed = stores.AnswerStore.completedAnswers[globalIndex];
      if (
        !completed ||
        typeof completed !== 'object' ||
        completed.questionId !== questionArr.id
      ) {
        return;
      }

      const completedContent = completed.content?.trim();
      if (!completedContent) return;

      const matched = matchSavedOption(completedContent, Options);
      if (!matched) return;

      initialAssignments.push({
        questionIndex,
        option: matched.option,
        originalIndex: matched.originalIndex,
      });

      if (!allowOptionReuse) {
        usedOptionIndexes.add(matched.originalIndex);
      }
    });

    setSlotAssignments(initialAssignments);
    setAvailableOptions(
      allowOptionReuse
        ? Options
        : Options.filter((opt) => !usedOptionIndexes.has(opt.originalIndex))
    );
  }, [questionArr.id, dragPrevCount, Options, Questions, allowOptionReuse]);

  const updateAnswerStore = (questionIndex: number, option: string) => {
    const globalIndex = getGlobalIndex(questionIndex);
    // 提取选项字母（如 "D" 从 "D Retailers should do more..."）
    const answerLetter = option.trim().charAt(0);
    const promptPrefix = promptItems[questionIndex]?.prefix || `${questionIndex + 1}`;

    submitStudentBlankAnswer(
      questionArr,
      questionIndex,
      dragPrevCount,
      answerLetter,
      questionIndex,
      promptPrefix
    );
    // 更新 AnswerStore
    stores.AnswerStore.changeAnswer(globalIndex, {
      questionId: questionArr.id,
      content: answerLetter,
      prefix: promptPrefix,
    });

    runInAction(() => {
      const questionNo = dragPrevCount + questionIndex + 1;
      if (!stores.ExamStore.correctListenAnswer.includes(questionNo)) {
        stores.ExamStore.correctListenAnswer.push(questionNo);
      }
    });
  };

  const clearAnswerStore = (questionIndex: number) => {
    const globalIndex = getGlobalIndex(questionIndex);
    runInAction(() => {
      const questionNo = dragPrevCount + questionIndex + 1;
      const indexToRemove = stores.ExamStore.correctListenAnswer.indexOf(questionNo);
      if (indexToRemove !== -1) {
        stores.ExamStore.correctListenAnswer.splice(indexToRemove, 1);
      }
      stores.AnswerStore.changeAnswer(globalIndex, {
        questionId: questionArr.id,
        content: '',
        prefix: promptItems[questionIndex]?.prefix || `${questionIndex + 1}`,
      });
    });
  };

  // ========== 修复后的 handleDrop ==========
  const handleDrop = (item: { option: string; index: number }, questionIndex: number) => {
    const currentSlotAssignments = slotAssignmentsRef.current;
    const previous = currentSlotAssignments.find((slot) => slot.questionIndex === questionIndex);
    const optionText = item.option;

    // 允许重用选项：直接替换，不改变 availableOptions
    if (allowOptionReuse) {
      setSlotAssignments((prev) => [
        ...prev.filter((slot) => slot.questionIndex !== questionIndex),
        { questionIndex, option: optionText, originalIndex: item.index },
      ]);
      updateAnswerStore(questionIndex, item.option);
      stores.ExamStore.changeCurrent(dragPrevCount + questionIndex + 1);
      return;
    }

    // 不允许重用：构建新的 availableOptions
    // 1. 先以当前 availableOptions 为基准
    let newAvailable = [...availableOptionsRef.current];

    // 2. 如果有 previous，恢复它
    if (previous) {
      const exists = newAvailable.some((opt) => opt.originalIndex === previous.originalIndex);
      if (!exists) {
        newAvailable.push({
          option: previous.option,
          originalIndex: previous.originalIndex,
          letter: previous.option.trim().charAt(0),
        });
        newAvailable.sort((a, b) => a.originalIndex - b.originalIndex);
      }
    }

    // 3. 移除被选中的新选项
    newAvailable = newAvailable.filter((opt) => opt.originalIndex !== item.index);

    // 一次性更新 availableOptions
    setAvailableOptions(newAvailable);

    // 4. 更新 slotAssignments
    setSlotAssignments((prev) => [
      ...prev.filter((slot) => slot.questionIndex !== questionIndex),
      { questionIndex, option: optionText, originalIndex: item.index },
    ]);

    updateAnswerStore(questionIndex, item.option);
    stores.ExamStore.changeCurrent(dragPrevCount + questionIndex + 1);
  };

  const handleRemove = (questionIndex: number) => {
    const removed = slotAssignmentsRef.current.find((slot) => slot.questionIndex === questionIndex);
    if (!removed) return;

    setSlotAssignments((prev) => prev.filter((slot) => slot.questionIndex !== questionIndex));
    clearAnswerStore(questionIndex);

    if (!allowOptionReuse) {
      const newAvailable = [...availableOptionsRef.current];
      const exists = newAvailable.some((opt) => opt.originalIndex === removed.originalIndex);
      if (!exists) {
        newAvailable.push({
          option: removed.option,
          originalIndex: removed.originalIndex,
          letter: removed.option.trim().charAt(0),
        });
        newAvailable.sort((a, b) => a.originalIndex - b.originalIndex);
      }
      setAvailableOptions(newAvailable);
    }
  };

  const getAssignedOption = (questionIndex: number) =>
    slotAssignments.find((slot) => slot.questionIndex === questionIndex)?.option;

  if (Questions.length === 0 && Options.length === 0) {
    return (
      <div className="drag-question-empty">
        <p>拖拽题数据加载异常，请刷新页面或联系老师检查题目配置。</p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <div className='drag-questionTitle'>{parse(questionArr.title || '')}</div>
        {allowOptionReuse ? (
          <p className="drag-question-hint">选项可重复使用，请为每个空位选择最合适的答案</p>
        ) : null}
        <div style={{ display: 'flex' }}>
          <div className='drag-question-option-box'>
            {optionTitle ? <div className='drag-question-title'>{optionTitle}</div> : null}
            {(allowOptionReuse ? Options : availableOptions).map((option) => (
              <Option
                key={`${option.originalIndex}-${option.option}`}
                option={option.option}
                index={option.originalIndex}
              />
            ))}
          </div>
          <div className='drag-question-question-box'>
            {title ? <div className='drag-question-title' style={{ marginTop: '2vh' }}>{title}</div> : null}
            {Questions.map((question, questionIndex) => (
              <div key={questionIndex} className='drag-question-question' style={{ marginBottom: '10px' }}>
                {question}
                <DropTarget
                  questionIndex={questionIndex}
                  onDrop={handleDrop}
                  onRemove={handleRemove}
                  assignedOption={getAssignedOption(questionIndex)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}