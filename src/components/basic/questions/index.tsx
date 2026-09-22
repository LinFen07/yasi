import { Radio, Checkbox } from "antd";
import { useState, useRef, useEffect } from "react";
import stores from "@/stores";
import parse from "html-react-parser";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import {
  computedPrevCount,
  getQuestionSlotCount,
  getRequiredSelectCount,
} from "@/utils/helper/computed";
import { submitStudentSelectAnswer } from "@/utils/browser/submitAnswer";
import TickQuestion from "../tickQuestion/index";
import DragQuestion from "../dragQuestion";
import { Exam } from "@/typings/exam";
import { shouldStartFreshExam } from '@/utils/helper/examDataManager';

function questions({ exam, shouldReset }: { exam: Exam[]; shouldReset?: boolean }) {
  const resetAnswers = shouldReset ?? shouldStartFreshExam();
  const [listensArr, setListensArr] = useState(exam[0]);
  const [questionsArr, setQuestionArr] = useState(listensArr.questionItems);
  const titleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const questionIndex = stores.ExamStore.currentExamIndex;
  const lastFocusedInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle[4] - 1;
    setListensArr(exam[index]);
    setQuestionArr(exam[index].questionItems);
  }, [stores.ExamStore.currentExamTitle]);

  // 初始化答案数组
  useEffect(() => {
    const getItemLength = (item: any): number => {
      if (item.questionType === 7) return 0;
      if (item.questionType === 1) return 1;
      if (item.questionType === 2) return getRequiredSelectCount(item);
      if (item.questionType === 6 && item.items) {
        const promptCount = item.items.filter((i: any) => i.itemUuid === 'prompt').length;
        return promptCount > 0 ? promptCount : item.items.length;
      }
      if ([4, 5].includes(item.questionType)) {
        return item.items ? item.items.length : 0;
      }
      return item.items ? item.items.length : 1;
    };

    const initAnswers = exam.flatMap((part) => {
      return part.questionItems.flatMap((questionItem) => {
        const count = getItemLength(questionItem);
        return Array.from({ length: count }, (_, idx) => ({
          questionId: questionItem.id,
          content: "",
          prefix: String(idx + 1),
        }));
      });
    });

    const savedAnswers = stores.AnswerStore.completedAnswers;
    const isFreshStart = stores.ExamStore.freshModuleSession;
    if (isFreshStart) {
      runInAction(() => { stores.ExamStore.setFreshModuleSession(false); });
    }
    const hasSavedContent =
      !isFreshStart &&
      resetAnswers === false &&
      Array.isArray(savedAnswers) &&
      savedAnswers.some(
        (item) => item && typeof item === 'object' && String(item.content || '').trim()
      );

    if (!hasSavedContent) {
      stores.AnswerStore.initAnswer(initAnswers);
      runInAction(() => { stores.ExamStore.resetcorrectListenAnswer(); });
    } else {
      runInAction(() => { stores.ExamStore.resetcorrectListenAnswer(); });
    }
  }, [exam, resetAnswers]);

  const getGlobalIndex = (questionIndex: number) => {
    const pre = computedPrevCount(stores.ExamStore.currentExamTitle, exam);
    const beforeCount = questionsArr
      .slice(0, questionIndex)
      .reduce((acc, q) => acc + getQuestionSlotCount(q), 0);
    return pre + beforeCount;
  };

  const onChange = (index: number) => (e: any) => {
    const pre = computedPrevCount(stores.ExamStore.currentExamTitle, exam);
    const beforeCount = questionsArr
      .slice(0, index)
      .reduce((acc, q) => acc + getQuestionSlotCount(q), 0);
    const start = pre + beforeCount + 1;

    stores.ExamStore.changeStudentListenAnswer(start, e.target.value);
    const examIndex = +stores.ExamStore.currentExamTitle[4] - 1;
    const value = e.target.value;

    submitStudentSelectAnswer(questionsArr, index, value, start - 1);

    const updatedQuestions = { ...questionsArr[index] };
    updatedQuestions.answer = value.toString();
    const newQuestionsArr = questionsArr.map((question, idx) =>
      idx === index ? updatedQuestions : question
    );
    setQuestionArr(newQuestionsArr);
    stores.ExamStore.changeCurrent(start);
    stores.ExamStore.updateListenExam(examIndex, index, updatedQuestions);

    runInAction(() => {
      if (!stores.ExamStore.correctListenAnswer.includes(start)) {
        stores.ExamStore.correctListenAnswer.push(start);
      }
    });
  };

  const checkedOnChange = (index: number) => (checkedValues: string[]) => {
    const currentQuestion = questionsArr[index];
    const requiredCount = getRequiredSelectCount(currentQuestion);

    // 超过上限就截断（保留最先勾选的前 N 个）
    let finalValues = checkedValues;
    if (finalValues.length > requiredCount) {
      finalValues = finalValues.slice(0, requiredCount);
    }

    const pre = computedPrevCount(stores.ExamStore.currentExamTitle, exam);
    const beforeCount = questionsArr
      .slice(0, index)
      .reduce((acc, q) => acc + getQuestionSlotCount(q), 0);
    const start = pre + beforeCount + 1;
    const examIndex = +stores.ExamStore.currentExamTitle[4] - 1;
    const slotCount = getQuestionSlotCount(currentQuestion);

    // ============================================================
    // 关键：把"可能覆盖第一个槽位"的操作全部放在前面
    // 最后再统一写 N 个槽位，保证最终结果一定是"一项一个字母"
    // ============================================================

    // 1. 提交到后端（内部可能会把 join 后的字符串写进第一个槽位）
    submitStudentSelectAnswer(
      questionsArr,
      index,
      finalValues.join(","),
      start - 1
    );

    // 2. 让 ExamStore 记录当前题号（内部也可能写 AnswerStore）
    //    这里只传第一个字母，避免它把整串写进去
    stores.ExamStore.changeStudentListenAnswer(start, finalValues[0] || "");

    // 3. 更新题目状态（本地 state，作为受控 value 的来源）
    const updatedQuestions = { ...questionsArr[index] };
    updatedQuestions.selectionsAnswer = finalValues;
    updatedQuestions.answer = finalValues.join(",");
    const newQuestionsArr = questionsArr.map((question, idx) =>
      idx === index ? updatedQuestions : question
    );
    setQuestionArr(newQuestionsArr);
    stores.ExamStore.changeCurrent(start);
    stores.ExamStore.updateListenExam(examIndex, index, updatedQuestions);

    // 4. 最后统一写 N 个槽位（覆盖前面任何"整串写入"）
    //    每个槽位只存一个字母，绝不写 join 后的字符串
    for (let i = 0; i < slotCount; i++) {
      stores.AnswerStore.changeAnswer(start - 1 + i, {
        questionId: currentQuestion.id,
        content: finalValues[i] || "",
        prefix: `${i + 1}`,
      });
    }

    runInAction(() => {
      if (finalValues.length >= requiredCount) {
        const num = start;
        if (!stores.ExamStore.correctListenAnswer.includes(num)) {
          stores.ExamStore.correctListenAnswer.push(num);
        }
      }
    });
  };

  // ========== 滚动定位逻辑 ==========
  useEffect(() => {
    let pre = 0;
    let partIndex = -1;
    for (let p = 0; p < exam.length; p++) {
      const part = exam[p];
      let partLen = 0;
      for (let q of part.questionItems) {
        partLen += getQuestionSlotCount(q);
      }
      if (questionIndex <= pre + partLen) {
        partIndex = p;
        break;
      }
      pre += partLen;
    }
    if (partIndex === -1) return;

    const partItems = exam[partIndex].questionItems;
    const currentIndexInPart = questionIndex - pre - 1;
    let accumulated = 0;
    let foundIndex = -1;
    for (let i = 0; i < partItems.length; i++) {
      const count = getQuestionSlotCount(partItems[i]);
      if (currentIndexInPart >= accumulated && currentIndexInPart < accumulated + count) {
        foundIndex = i;
        break;
      }
      accumulated += count;
    }
    if (foundIndex === -1) return;

    const isFillBlank = partItems[foundIndex].topicType === 4;

    if (!isFillBlank) {
      titleRefs.current[foundIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    const target = document.querySelector<HTMLInputElement>(
      `.textInput[data-index="${questionIndex}"]`
    );
    if (target) {
      if (document.activeElement === target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const timer = setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.focus();
        lastFocusedInputRef.current = target;
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [questionIndex, exam, questionsArr]);

  const [fontSize, setFontSize] = useState(stores.ExamStore.FontSize);
  useEffect(() => {
    setFontSize(stores.ExamStore.FontSize);
  }, [stores.ExamStore.FontSize]);

  const stripHtmlTags = (html: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    return textContent
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const replaceFontSize = (html: string, fontSize: number): string => {
    const htmlWithMeta = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlWithMeta, "text/html");
    const elements = doc.body.querySelectorAll("*");
    elements.forEach((el: any) => {
      let currentStyle = el.getAttribute("style") || "";
      const fontSizeRegex = /font-size\s*:\s*[^;]+;?/gi;
      currentStyle = currentStyle.replace(fontSizeRegex, "").trim();
      currentStyle += ` font-size:${fontSize}px;`;
      el.setAttribute("style", currentStyle);
    });
    return doc.body.innerHTML;
  };

  const cleanQuestionContent = (html: string): string => {
    if (!html) return html;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const pElements = tempDiv.querySelectorAll("p");
    pElements.forEach(p => {
      const isInOption = p.closest('.ant-radio-wrapper, .ant-checkbox-wrapper');
      if (!isInOption) {
        const content = p.innerHTML.trim();
        const hasOnlyBr = /^(<br\s*\/?>)+$/.test(content);
        const isEmpty = content === '' || content === '<br>' || content === '<br/>';
        const hasOnlyWhitespace = /^\s*$/.test(p.textContent || '');
        const hasOnlyZeroWidthSpace = /^(&ZeroWidthSpace;|\u200B|\uFEFF)+$/i.test(content) ||
          /<span[^>]*>&ZeroWidthSpace;<\/span>/i.test(content);
        // 图片/媒体独占段落时 textContent 为空，不能按空段落删除
        const hasMedia = !!p.querySelector('img, video, svg, iframe, table');
        if (!hasMedia && (hasOnlyBr || isEmpty || hasOnlyWhitespace || hasOnlyZeroWidthSpace)) {
          p.remove();
        }
      }
    });
    return tempDiv.innerHTML;
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .listencontent > div > div:first-child p:empty,
      .listencontent > div > div:first-child p:has(> br:only-child),
      .listencontent > div > div:first-child p:has(span:contains("&ZeroWidthSpace;")) {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="listencontent">
      {questionsArr.map((questionArr, index) => {
        const requiredSelectCount =
          questionArr.questionType === 2
            ? getRequiredSelectCount(questionArr)
            : 0;

        return (
          <div key={index}>
            {questionArr.topicType == "5" ? (
              <div ref={(el) => (titleRefs.current[index] = el)}>
                <TickQuestion {...questionArr} exam={exam} />
              </div>
            ) : questionArr.topicType == "6" ? (
              <div ref={(el) => (titleRefs.current[index] = el)}>
                <DragQuestion {...questionArr} exam={exam} />
              </div>
            ) : questionArr.topicType == "4" ? (
              <div>{parse(cleanQuestionContent(replaceFontSize(questionArr.title, fontSize)))}</div>
            ) : (
              <div ref={(el) => (titleRefs.current[index] = el)}>
                {parse(cleanQuestionContent(replaceFontSize(questionArr.title, fontSize)))}
                {questionArr.questionType === 2 && requiredSelectCount > 0 && (
                  <span style={{ color: "#666", fontSize: "14px" }}>
                    （最多选{requiredSelectCount === 2 ? "两" : requiredSelectCount}项）
                  </span>
                )}
              </div>
            )}
            <div>
              {questionArr.topicType == "1" ? (
                <Radio.Group
                  style={{ width: "100%", display: "flex", flexDirection: "column" }}
                  onChange={onChange(index)}
                  value={(() => {
                    const globalIdx = getGlobalIndex(index);
                    return stores.AnswerStore.completedAnswers[globalIdx]?.content || '';
                  })()}
                  options={questionArr.items.map((opt) => ({
                    value: opt.prefix,
                    label: (
                      <span style={{ display: "flex", alignItems: "center", fontSize: `${fontSize}px` }}>
                        {opt.prefix}
                        <p style={{ width: "8px" }}></p>
                        {stripHtmlTags(opt.content)}
                      </span>
                    ),
                  }))}
                />
              ) : questionArr.topicType == "2" ? (
                <Checkbox.Group
                  style={{ width: "100%", display: "flex", flexDirection: "column" }}
                  onChange={checkedOnChange(index)}
                  value={(() => {
                    if (Array.isArray(questionArr.selectionsAnswer)) {
                      return questionArr.selectionsAnswer;
                    }
                    const startIdx = getGlobalIndex(index);
                    const slotCount = getQuestionSlotCount(questionArr);
                    const values: string[] = [];
                    for (let i = 0; i < slotCount; i++) {
                      const ans = stores.AnswerStore.completedAnswers[startIdx + i];
                      if (ans && typeof ans === 'object' && ans.content) {
                        values.push(ans.content);
                      }
                    }
                    return values;
                  })()}
                  options={questionArr.items.map((opt) => ({
                    value: opt.prefix,
                    label: (
                      <span style={{ display: "flex", alignItems: "center", fontSize: `${fontSize}px` }}>
                        {opt.prefix}
                        <p style={{ width: "8px" }}></p>
                        {stripHtmlTags(opt.content)}
                      </span>
                    ),
                  }))}
                />
              ) : null}
            </div>
            <div style={{ height: "24px" }}></div>
          </div>
        );
      })}
    </div>
  );
}

export default observer(questions);