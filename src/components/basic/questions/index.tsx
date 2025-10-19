import { Radio, Checkbox } from "antd";
import { useState, useRef, useEffect } from "react";
import stores from "@/stores";
import parse from "html-react-parser";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import {
  computedBlanksPrevCount,
  computedCheckSelectPrevCount,
  computedPrevCount,
} from "@/utils/helper/computed";
import { submitStudentSelectAnswer } from "@/utils/browser/submitAnswer";
import TickQuestion from "../tickQuestion/index";
import DragQuestion from "../dragQuestion";
import SelectQuestion from "../selectQuestion";
import { Exam } from "@/typings/exam";

function questions({ exam }: { exam: Exam[] }) {
  const [listensArr, setListensArr] = useState(exam[0]);
  const [questionsArr, setQuestionArr] = useState(listensArr.questionItems);
  const titleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const questionIndex = stores.ExamStore.currentExamIndex;

  useEffect(() => {
    const index = +stores.ExamStore.currentExamTitle[4] - 1;
    setListensArr(exam[index]);
    setQuestionArr(exam[index].questionItems);
    console.log(questionsArr);
  }, [stores.ExamStore.currentExamTitle]);

  const onChange = (index: number) => (e: any) => {
    let pre = computedPrevCount(
      stores.ExamStore.currentExamTitle,
      stores.ExamStore.currentExam
    );
    stores.ExamStore.changeStudentListenAnswer(pre + index + 1, e.target.value);
    const examIndex = +stores.ExamStore.currentExamTitle[4] - 1;
    const value = e.target.value;

    //向数据提交答案
    submitStudentSelectAnswer(questionsArr, index, value, index + pre);

    const updatedQuestions = { ...questionsArr[index] };
    updatedQuestions.answer = value.toString();
    const newQuestionsArr = questionsArr.map((question, idx) =>
      idx === index ? updatedQuestions : question
    );
    setQuestionArr(newQuestionsArr);
    stores.ExamStore.changeCurrent(pre + index + 1);
    stores.ExamStore.updateListenExam(examIndex, index, updatedQuestions);
    runInAction(() => {
      // 避免重复添加同一题号
      const currentQuestionNumber = pre + index + 1;
      if (
        !stores.ExamStore.correctListenAnswer.includes(currentQuestionNumber)
      ) {
        stores.ExamStore.correctListenAnswer.push(currentQuestionNumber);
      }
    });
  };

  const checkedOnChange = (index: number) => (checkedValues: string[]) => {
    // 获取当前题目信息
    const currentQuestion = questionsArr[index];
    // 处理双选题的选择限制
    let finalValues = checkedValues;
    if (checkedValues.length > 2) {
      // 超过2个选项时，保留最后选择的两个
      finalValues = checkedValues.slice(-2);
    }

    const pre = computedCheckSelectPrevCount(
      stores.ExamStore.currentExamTitle,
      exam
    );
    stores.ExamStore.changeStudentListenAnswer(
      pre + index + 1,
      finalValues.toString()
    );
    const examIndex = +stores.ExamStore.currentExamTitle[4] - 1;

    submitStudentSelectAnswer(
      questionsArr,
      index,
      finalValues.toString(),
      index + pre
    );

    const updatedQuestions = { ...questionsArr[index] };
    updatedQuestions.selectionsAnswer = finalValues;
    // 同步设置 answer，便于题号变色统一依赖
    updatedQuestions.answer = finalValues.join(",");
    const newQuestionsArr = questionsArr.map((question, idx) =>
      idx === index ? updatedQuestions : question
    );
    setQuestionArr(newQuestionsArr);
    // 更新当前题号，保障定位
    stores.ExamStore.changeCurrent(pre + index + 1);
    stores.ExamStore.updateListenExam(examIndex, index, updatedQuestions);
    runInAction(() => {
      // 根据题目要求数量（correctArray.length）决定需要标记的题号个数
      const requiredCount =
        currentQuestion && Array.isArray(currentQuestion.correctArray)
          ? currentQuestion.correctArray.length
          : 1;
      // 计算当前题之前累计占用的题号数量（考虑 correctArray.length）
      const beforeCount = questionsArr
        .slice(0, index)
        .reduce(
          (acc, q) => acc + (Array.isArray(q.correctArray) ? q.correctArray.length : 1),
          0
        );
      // 与 FooterNav 编号策略一致：计算前置分区累计题号数
      const partIndex = +stores.ExamStore.currentExamTitle[4] - 1;
      const prevLenPartsSum = exam
        .slice(0, partIndex)
        .reduce((acc, part) => {
          const partCount = part.questionItems.reduce(
            (pAcc, item) =>
              pAcc + (Array.isArray(item.correctArray) ? item.correctArray.length : 1),
            0
          );
          return acc + partCount;
        }, 0);
      const start = prevLenPartsSum + beforeCount + 1;
      // 仅当用户选择数量达到要求时，标记为已作答
      if (finalValues.length >= requiredCount) {
        for (let k = 0; k < requiredCount; k++) {
          const num = start + k;
          if (!stores.ExamStore.correctListenAnswer.includes(num)) {
            stores.ExamStore.correctListenAnswer.push(num);
          }
        }
      }
    });
  };

  useEffect(() => {
    let prevCount = computedPrevCount(stores.ExamStore.currentExamTitle, exam);
    let BlanksprevCount = computedBlanksPrevCount(
      prevCount,
      stores.ExamStore.currentExamTitle,
      exam
    );

    titleRefs.current[questionIndex - prevCount - 1]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    const inputAll = document.querySelectorAll(".textInput");
    //@ts-ignore
    inputAll[questionIndex - BlanksprevCount - 1]?.focus();
    inputAll[questionIndex - BlanksprevCount - 1]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [questionIndex]);

  //字体大小
  const [fontSize, setFontSize] = useState(stores.ExamStore.FontSize);

  useEffect(() => {
    setFontSize(stores.ExamStore.FontSize);
  }, [stores.ExamStore.FontSize]);

  const stripHtmlTags = (html: string): string => {
    // 创建一个临时的 DOM 元素来安全地解析 HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // 获取纯文本内容，这样可以正确处理字符编码
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    // 清理常见的 HTML 实体
    return textContent
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const replaceFontSize = (html: string, fontSize: number): string => {
    // 确保 HTML 内容包含正确的字符编码声明
    const htmlWithMeta = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlWithMeta, "text/html");

    const elements = doc.body.querySelectorAll("*");
    elements.forEach((el: any) => {
      // 如果已有 style 属性，保留原有内容并添加 font-size
      let currentStyle = el.getAttribute("style") || "";
      const fontSizeRegex = /font-size\s*:\s*[^;]+;?/gi;
      currentStyle = currentStyle.replace(fontSizeRegex, "").trim(); // 移除已有的 font-size
      currentStyle += ` font-size:${fontSize}px;`;
      el.setAttribute("style", currentStyle);
    });

    return doc.body.innerHTML;
  };

  return (
    <div className="listencontent">
      {questionsArr.map((questionArr, index) => (
        <div key={index}>
          {questionArr.topicType == "5" ? (
            <TickQuestion {...questionArr}></TickQuestion>
          ) : questionArr.topicType == "6" ? (
            <DragQuestion {...questionArr}></DragQuestion>
          ) : questionArr.topicType == "4" ? (
            <div>{parse(replaceFontSize(questionArr.title, fontSize))}</div>
          ) : (
            <div ref={(el) => (titleRefs.current[index] = el)}>
              {parse(questionArr.title.replace(/<\/?i>/g, ""))}
              {/* 显示双选题提示 */}
              {questionArr.topicType === "7" && (
                <span style={{ color: "#666", fontSize: "14px" }}>（最多选两项）</span>
              )}
            </div>
          )}
          <div>
            {questionArr.topicType == "1" ? (
              <Radio.Group
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
                onChange={onChange(index)}
                value={questionArr.answer ? questionArr.answer : ""}
                options={questionArr.items.map((opt) => ({
                  value: opt.prefix,
                  label: (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: `${fontSize}px`,
                      }}
                    >
                      {opt.prefix}
                      <p style={{ width: "8px" }}></p>
                      {stripHtmlTags(opt.content)}
                    </span>
                  ),
                }))}
              ></Radio.Group>
            ) : questionArr.topicType == "2" || questionArr.topicType == "7" ? (
              <Checkbox.Group
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
                onChange={checkedOnChange(index)}
                value={
                  questionArr.selectionsAnswer
                    ? questionArr.selectionsAnswer
                    : []
                }
                options={questionArr.items.map((opt) => ({
                  value: opt.prefix,
                  label: (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: `${fontSize}px`,
                      }}
                    >
                      {opt.prefix}
                      <p style={{ width: "8px" }}></p>
                      {stripHtmlTags(opt.content)}
                    </span>
                  ),
                }))}
              ></Checkbox.Group>
            ) : (
              <></>
            )}
          </div>
          <div style={{ height: "24px" }}></div>
        </div>
      ))}
    </div>
  );
}

export default observer(questions);
