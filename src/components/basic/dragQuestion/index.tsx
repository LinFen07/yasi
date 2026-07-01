import { useEffect, useMemo, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ExamType, Exam, Items } from "@/typings/exam";
import TurndownService from 'turndown';
import './index.scss';
import stores from '@/stores';
import { computedDragPrevCount } from '@/utils/helper/computed';
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
  if (prefix && content) return `${prefix} ${content}`;
  return prefix || content;
}

function parseTitleMetaFromMarkdown(markdown: string) {
  const lines = markdown.split('\n').map(line => line.trim()).filter(Boolean);

  const optionRegex = /^([A-Z])[.)]?\s*(.+)$|^([A-Z])\s+(.+)$/;
  const questionRegex = /^\*\*(\d+)\*\*\s*(.*)$|^(\d+)[.)]?\s*(.+)$/;

  const Options: DragOption[] = [];
  const Questions: string[] = [];
  let questionTitle = lines[0]?.replace(/\*\*/g, '') || '';
  let optionTitle = '';
  let title = '';

  for (let i = 1; i < lines.length; i++) {
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
      if (!optionTitle) optionTitle = cleanedLine;
      else if (!title) title = cleanedLine;
    }
  }

  return { questionTitle, Questions, Options, optionTitle, title };
}

function buildDragQuestionData(questionArr: ExamType) {
  const items = questionArr.items || [];
  const promptItems = items.filter(item => item.itemUuid === 'prompt');
  const optionItems = items.filter(item => item.itemUuid !== 'prompt');

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

function getSavedDragAnswer(globalIndex: number, options: DragOption[], questionId: number) {
  const completed = stores.AnswerStore.completedAnswers[globalIndex];
  if (
    !completed ||
    typeof completed !== 'object' ||
    completed.questionId !== questionId
  ) {
    return '';
  }

  const completedContent = completed.content?.trim();
  if (!completedContent) return '';

  const matched = matchSavedOption(completedContent, options);
  return matched ? matched.option : '';
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

  const dragPrevCount = computedDragPrevCount(stores.ExamStore.currentExamTitle, questionArr.exam || []);
  const getGlobalIndex = (questionIndex: number) => dragPrevCount + questionIndex;

  const [availableOptions, setAvailableOptions] = useState<DragOption[]>(Options);
  const [slotAssignments, setSlotAssignments] = useState<SlotAssignment[]>([]);

  useEffect(() => {
    const initialAssignments: SlotAssignment[] = [];
    const usedOptionIndexes = new Set<number>();

    Questions.forEach((_, questionIndex) => {
      const savedAnswer = getSavedDragAnswer(getGlobalIndex(questionIndex), Options, questionArr.id);
      if (!savedAnswer) return;

      const matched = matchSavedOption(savedAnswer, Options);
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
    stores.AnswerStore.dragAnswers[globalIndex] = option;

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
      stores.AnswerStore.dragAnswers[globalIndex] = '';
      stores.AnswerStore.changeAnswer(globalIndex, {
        questionId: questionArr.id,
        content: '',
        prefix: promptItems[questionIndex]?.prefix || `${questionIndex + 1}`,
      });
    });
  };

  const handleDrop = (item: { option: string; index: number }, questionIndex: number) => {
    const previous = slotAssignments.find((slot) => slot.questionIndex === questionIndex);

    setSlotAssignments((prev) => [
      ...prev.filter((slot) => slot.questionIndex !== questionIndex),
      { questionIndex, option: item.option, originalIndex: item.index },
    ]);

    if (allowOptionReuse) {
      updateAnswerStore(questionIndex, item.option);
      stores.ExamStore.changeCurrent(dragPrevCount + questionIndex + 1);
      return;
    }

    if (previous) {
      setAvailableOptions((prev) => {
        const exists = prev.some((opt) => opt.originalIndex === previous.originalIndex);
        if (exists) return prev;
        const next = [...prev, {
          option: previous.option,
          originalIndex: previous.originalIndex,
          letter: previous.option.trim().charAt(0),
        }];
        return next.sort((a, b) => a.originalIndex - b.originalIndex);
      });
    }

    setAvailableOptions((prev) => prev.filter((opt) => opt.originalIndex !== item.index));
    updateAnswerStore(questionIndex, item.option);
    stores.ExamStore.changeCurrent(dragPrevCount + questionIndex + 1);
  };

  const handleRemove = (questionIndex: number) => {
    const removed = slotAssignments.find((slot) => slot.questionIndex === questionIndex);
    if (!removed) return;

    setSlotAssignments((prev) => prev.filter((slot) => slot.questionIndex !== questionIndex));
    clearAnswerStore(questionIndex);

    if (!allowOptionReuse) {
      setAvailableOptions((prev) => {
        const exists = prev.some((opt) => opt.originalIndex === removed.originalIndex);
        if (exists) return prev;
        const next = [...prev, {
          option: removed.option,
          originalIndex: removed.originalIndex,
          letter: removed.option.trim().charAt(0),
        }];
        return next.sort((a, b) => a.originalIndex - b.originalIndex);
      });
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
        <div className='drag-questionTitle'>{questionTitle}</div>
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
