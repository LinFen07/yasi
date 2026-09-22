import React, { useEffect, useState } from "react";
import TurndownService from "turndown";
import { Table } from "antd";
import { ExamType, Exam } from "@/typings/exam";
import "./index.scss";
import {
  computedPrevCount,
  getQuestionSlotCount,
} from "@/utils/helper/computed";
import stores from "@/stores";
import { runInAction } from "mobx";
import { submitStudentSelectAnswer } from "@/utils/browser/submitAnswer";

interface RecordType {
  key: number; // 实际题号
  describe?: string;
  question: string;
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  E?: string;
  F?: string;
  G?: string;
  H?: string;
  I?: string;
}

const tickQuestion = (questionArr: ExamType & { exam?: Exam[] }) => {
  const exam = questionArr.exam || [];
  const title = stores.ExamStore.currentExamTitle;
  const partIndex = +title[4] - 1;
  const part = exam[partIndex];

  // 计算当前 part 之前的题号总数
  const pre = computedPrevCount(title, exam);

  // 找到当前题组在 part.questionItems 中的索引
  const currentIndex = part.questionItems.findIndex(
    (item) => item.id === questionArr.id,
  );
  // 计算当前题组之前的题组占用的总题号数（在当前 part 内）
  const beforeCount = part.questionItems
    .slice(0, currentIndex)
    .reduce((acc, q) => acc + getQuestionSlotCount(q), 0);

  // 当前题组起始题号（第一个小题的题号）
  const start = pre + beforeCount + 1;

  // 从 title 中提取图片 URL
  const imgMatch = questionArr.title.match(/<img[^>]+src=["']([^"']+)["']/);
  const png = imgMatch ? [imgMatch[1]] : [];

  // 从 title 中提取题目描述（去掉 img 标签后的内容）
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = questionArr.title;
  const imgEl = tempDiv.querySelector("img");
  let questionTitle = "";
  if (imgEl) {
    imgEl.remove();
    questionTitle = tempDiv.textContent?.trim() || "";
  }

  // 使用 items 数组生成表格数据
  const tableData: RecordType[] = (questionArr.items || []).map(
    (item, index) => {
      const questionNo = start + index; // 实际题号（16, 17, 18, 19, 20）
      return {
        key: questionNo,
        describe: item.describe || "",
        question: item.content || "",
      };
    },
  );

  // 初始化数据源，从 completedAnswers 恢复已有答案
  const [dataSource, setDataSource] = useState<RecordType[]>(() => {
    return tableData.map((item) => {
      const answer =
        stores.AnswerStore.completedAnswers[item.key - 1]?.content || "";
      if (answer) {
        return {
          ...item,
          describe: item.describe,
          [answer]: "√",
        };
      }
      return item;
    });
  });

  const handleCellClick = (record: RecordType, dataIndex: string) => {
    const questionNo = record.key;
    const localIndex = questionNo - start; // 该行在图表题中的局部索引（0-based）
    const prefix = String(localIndex + 1);

    // 提交答案到后端
    submitStudentSelectAnswer([questionArr], 0, dataIndex, questionNo - 1);

    // 更新 AnswerStore
    runInAction(() => {
      stores.AnswerStore.changeAnswer(questionNo - 1, {
        questionId: questionArr.id,
        content: dataIndex,
        prefix: prefix,
      });
      // 标记已答
      if (!stores.ExamStore.correctListenAnswer.includes(questionNo)) {
        stores.ExamStore.correctListenAnswer.push(questionNo);
      }
    });

    // 更新 UI
    setDataSource((prevData) =>
      prevData.map((item) => {
        if (item.key === record.key) {
          const updatedItem = { ...item };
          // 清除同一行的所有选项
          ["A", "B", "C", "D", "E", "F", "G", "H", "I"].forEach((col) => {
            updatedItem[col] = undefined;
          });
          updatedItem[dataIndex] = "√";
          return updatedItem;
        }
        return item;
      }),
    );

    // 导航到该题号
    stores.ExamStore.changeCurrent(questionNo);
  };

  const columns = [
    {
      title: "",
      dataIndex: "describe",
      key: "describe",
      width: 150,
      render: (text: any) => <span>{text}</span>,
    },
    {
      title: "A",
      dataIndex: "A",
      key: "A",
      width: 70,
      editable: true,
    },
    {
      title: "B",
      dataIndex: "B",
      key: "B",
      width: 70,
      editable: true,
    },
    {
      title: "C",
      dataIndex: "C",
      key: "C",
      width: 70,
      editable: true,
    },
    {
      title: "D",
      dataIndex: "D",
      key: "D",
      width: 70,
      editable: true,
    },
    {
      title: "E",
      dataIndex: "E",
      key: "E",
      width: 70,
      editable: true,
    },
    {
      title: "F",
      dataIndex: "F",
      key: "F",
      width: 70,
      editable: true,
    },
    {
      title: "G",
      dataIndex: "G",
      key: "G",
      width: 70,
      editable: true,
    },
    {
      title: "H",
      dataIndex: "H",
      key: "H",
      width: 70,
      editable: true,
    },
    {
      title: "I",
      dataIndex: "I",
      key: "I",
      width: 70,
      editable: true,
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable || col.dataIndex === "describe") {
      return col;
    }
    return {
      ...col,
      onCell: (record: RecordType) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        onClick: () => handleCellClick(record, col.dataIndex),
      }),
      render: (text: string) =>
        text === "√" ? <span className="tick-mark">√</span> : text,
    };
  });

  return (
    <div style={{ marginTop: "20px" }}>
      <div>{questionTitle}</div>
      <div style={{ display: "flex" }}>
        <img className="tickQuestionImg" src={png[0]} alt="png" />
        <Table
          className="tickQuestionTable"
          bordered
          dataSource={dataSource}
          columns={mergedColumns}
          size="large"
          rowKey="key"
          pagination={false}
        />
      </div>
    </div>
  );
};

export default React.memo(tickQuestion);
