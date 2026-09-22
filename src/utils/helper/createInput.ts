import stores from '@/stores';
import type { Exam, ExamType } from '@/typings/exam';
import { autorun, runInAction } from 'mobx';
import {
  computedPrevCount,
  getQuestionSlotCount,
} from '@/utils/helper/computed';
import { submitStudentBlankAnswer } from '../browser/submitAnswer';
import { restrictChineseInput } from './inputRestriction';

// ========== createInput ==========
export function createInput(exam: Array<Exam>, type: string, container: any) {
  // 当前 part 的起始题号减 1
  const startOffset = computedPrevCount(stores.ExamStore.currentExamTitle, exam);

  // 更安全地获取当前 Part 索引：从标题中提取数字
  const title = stores.ExamStore.currentExamTitle || '';
  const match = title.match(/(\d+)/);
  const index = match ? parseInt(match[1], 10) - 1 : 0;

  // 清空所有填空占位符（只清空 .gapfilling-span）
  const allSpans = container.querySelectorAll('.gapfilling-span');
  allSpans.forEach((span: any) => (span.innerHTML = ''));

  setTimeout(() => {
    const span = container.querySelectorAll('.gapfilling-span');
    if (span.length === 0) return;

    let questionCounter = startOffset; // 全局题号偏移（所有题型累加）
    let fillIndex = 0;                // 仅用于 .gapfilling-span 的索引

    for (let j = 0; j < exam[index].questionItems.length; j++) {
      const questionArr = exam[index].questionItems[j];
      // 复用公共函数，多选题自动按动态数量计算
      const len = getQuestionSlotCount(questionArr);

      // 只对填空题 (4) 创建输入框，并传递 fillIndex
      if (questionArr.questionType === 4) {
        MyInput(questionCounter, questionArr, span, fillIndex);
        fillIndex += len; // 填空题索引增加
      }

      // 无论是否创建输入框，题号都要累加
      questionCounter += len;
    }

    // 移除自动聚焦，聚焦行为由上层控制
  });

  // 字号自动更新
  autorun(() => {
    const fontSize = stores.ExamStore.FontSize;
    const inputs = document.querySelectorAll<HTMLInputElement>('.textInput');
    inputs.forEach(input => {
      input.style.fontSize = `${fontSize}px`;
    });
  });
}

// ========== MyInput ==========
export function MyInput(
  startOffset: number,
  questionArr: ExamType,
  span: any,
  fillStartIndex: number
) {
  const items = questionArr.items || [];
  const len = items.length;

  for (let localIndex = 0; localIndex < len; localIndex++) {
    const questionNo = startOffset + localIndex + 1;
    const spanIndex = fillStartIndex + localIndex;

    if (spanIndex >= span.length || !span[spanIndex]) {
      console.error(`span[${spanIndex}] is undefined. Total spans: ${span.length}`);
      continue;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';

    const input = document.createElement('input');
    const placeholder = document.createElement('span');

    input.className = 'textInput';
    input.setAttribute('data-index', questionNo.toString());

    // 恢复已有答案
    const savedAnswer =
      stores.AnswerStore.completedAnswers[questionNo - 1]?.content || '';
    const persistedValue =
      localStorage.getItem(
        `answer-input-${stores.ExamStore.paperId}-${questionNo}`
      ) || '';

    if (savedAnswer || persistedValue) {
      const value = savedAnswer || persistedValue;
      input.value = value;
      placeholder.style.display = 'none';
      if (persistedValue && !savedAnswer) {
        submitStudentBlankAnswer(
          questionArr,
          localIndex,
          startOffset,
          persistedValue,
          localIndex,
          (localIndex + 1).toString()
        );
      }
    } else {
      placeholder.style.display = 'block';
    }

    placeholder.className = 'placeholder';
    placeholder.innerText = questionNo.toString();

    // 事件绑定
    input.addEventListener('focus', () => {
      placeholder.style.display = 'none';
      stores.ExamStore.changeCurrent(questionNo);
    });

    input.addEventListener('blur', () => {
      if (!input.value) placeholder.style.display = 'block';
    });

    input.addEventListener('input', () => {
      const original = input.value;
      const filtered = restrictChineseInput(original);
      localStorage.setItem(
        `answer-input-${stores.ExamStore.paperId}-${questionNo}`,
        filtered
      );

      if (original !== filtered) {
        input.value = filtered;
        console.warn('不允许输入中文字符');
      }

      if (input.value) {
        placeholder.style.display = 'none';
        submitStudentBlankAnswer(
          questionArr,
          localIndex,
          startOffset,
          input.value,
          localIndex,
          (localIndex + 1).toString()
        );
        runInAction(() => {
          if (!stores.ExamStore.correctListenAnswer.includes(questionNo)) {
            stores.ExamStore.correctListenAnswer.push(questionNo);
          }
        });
      } else {
        placeholder.style.display = 'block';
        runInAction(() => {
          const idx = stores.ExamStore.correctListenAnswer.indexOf(questionNo);
          if (idx !== -1) stores.ExamStore.correctListenAnswer.splice(idx, 1);
        });
      }
    });

    // 阻止中文输入法
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Process' || e.isComposing) {
        e.preventDefault();
        return false;
      }
    });
    input.addEventListener('compositionstart', (e) => e.preventDefault());
    input.addEventListener('compositionend', (e) => {
      e.preventDefault();
      const filtered = restrictChineseInput(input.value);
      input.value = filtered;
    });

    // 挂载到 DOM
    wrapper.appendChild(placeholder);
    wrapper.appendChild(input);
    span[spanIndex].innerHTML = '';
    span[spanIndex].appendChild(wrapper);
  }
}

// 辅助聚焦函数（保留以防其他用途）
function focusFirstAnswerInContainer(container: ParentNode) {
  const firstTextInput =
    container.querySelector<HTMLInputElement>('.textInput');
  const firstRadio = container.querySelector<HTMLInputElement>(
    'input[type="radio"]'
  );
  const target = firstTextInput || firstRadio;
  if (!target) return;
  requestAnimationFrame(() => {
    target.focus({ preventScroll: false });
  });
}