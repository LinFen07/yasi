import "./index.scss";

import { Button, Space } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import store from "@/stores";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { reaction, runInAction } from "mobx";
import { getQuestionSlotCount } from "@/utils/helper/computed"; // 导入统一计算函数

type pageType = {
  title: string;
  headTitleExpain: string;
  questionArr: number[];
  maxNum: number;
};

type propType = {
  type: string;
};

function footerNav(props: propType) {
  const { type } = props;

  const exam =
    type === "listen"
      ? store.ExamStore.getListenExam()
      : type === "read"
        ? store.ExamStore.getReadExam()
        : store.ExamStore.getWritteExam();
  let currentPage = store.ExamStore.currentExamIndex;

  const [curren, setCurren] = useState(currentPage);

  const getQuestionArr = (prevLen: number, len: number) => {
    const questionArr = [];
    let currLen = prevLen + len;
    for (let i = prevLen; i < currLen; i++) {
      questionArr.push(i + 1);
    }
    return {
      questionArr,
      currLen,
    };
  };

  // 移除了内部定义的 getItemLength，直接使用统一导入的 getQuestionSlotCount

  let prevLen = 0;
  const initialPageArr = exam.map((part, index) => {
    let allLen = 0;
    for (let i = 0; i < part.questionItems.length; i++) {
      const item = part.questionItems[i];
      const len = getQuestionSlotCount(item); // 使用统一函数
      allLen += len;
    }

    // 写作题(questionType=7)占位数为0，需要为每个Part至少保留1个导航按钮
    if (type === 'writte' && allLen === 0) {
      allLen = 1;
    }

    const { questionArr, currLen } = getQuestionArr(prevLen, allLen);
    prevLen = currLen;

    let writteTitle = "";
    let headTitleExpain =
      type === "listen"
        ? ` Questions ${prevLen - allLen + 1} - ${prevLen}`
        : type === "read"
          ? ` Read the passage below and answer questions ${prevLen - allLen + 1} - ${prevLen}`
          : type === "writte"
            ? `${writteTitle}`
            : "";

    return {
      title: `Part${index + 1}`,
      headTitleExpain,
      questionArr: questionArr,
      maxNum: currLen,
    };
  });

  const [PageArr, setPageArr] = useState<Array<pageType>>([]);

  const syncTitleByQuestionIndex = (pageArr: pageType[], questionIndex: number) => {
    for (const page of pageArr) {
      if (page.maxNum >= questionIndex) {
        store.ExamStore.changeCurrentTitle(page.title);
        store.ExamStore.changeTitleExpain(page.headTitleExpain);
        return;
      }
    }
  };

  const handleChangeTitle = (curren: number) => {
    syncTitleByQuestionIndex(PageArr.length > 0 ? PageArr : initialPageArr, curren);
  };

  useEffect(() => {
    if (initialPageArr.length === 0) return;

    setPageArr(initialPageArr);

    const savedIndex = store.ExamStore.currentExamIndex;
    const savedTitle = store.ExamStore.currentExamTitle;
    setCurren(savedIndex);

    const titleExists = initialPageArr.some(page => page.title === savedTitle);
    const savedIndexValid = initialPageArr.some(page => page.maxNum >= savedIndex);

    runInAction(() => {
      if (savedTitle && titleExists && savedIndexValid) {
        syncTitleByQuestionIndex(initialPageArr, savedIndex);
      } else {
        syncTitleByQuestionIndex(initialPageArr, 1);
        store.ExamStore.changeCurrent(1);
        setCurren(1);
      }
    });
  }, [type, exam.length]);

  const activeAction = (num: number) => {
    runInAction(() => {
      store.ExamStore.changeCurrent(num);
      setCurren(store.ExamStore.currentExamIndex);
      handleChangeTitle(num);
    });

    try {
      const state = {
        currentExamIndex: num,
        currentExamTitle: store.ExamStore.currentExamTitle,
        currentPageType: type,
        paperId: store.ExamStore.paperId,
      };
      localStorage.setItem('examPageState', JSON.stringify(state));
    } catch (error) {
      console.warn('保存页面状态失败:', error);
    }
  };

  const getMaxTotal = () => {
    if (initialPageArr.length === 0) return 0;
    return initialPageArr[initialPageArr.length - 1].maxNum;
  };

  const handleArrowAction = (arrow: string) => {
    const maxTotal = getMaxTotal();
    let newIndex = curren;
    runInAction(() => {
      if (arrow == "left") {
        newIndex = Math.max(1, curren - 1);
      } else if (arrow == "right") {
        newIndex = Math.min(maxTotal, curren + 1);
      }
      setCurren(newIndex);
      store.ExamStore.changeCurrent(newIndex);
      handleChangeTitle(newIndex);
    });

    try {
      const state = {
        currentExamIndex: newIndex,
        currentExamTitle: store.ExamStore.currentExamTitle,
        currentPageType: type,
        paperId: store.ExamStore.paperId,
      };
      localStorage.setItem('examPageState', JSON.stringify(state));
    } catch (error) {
      console.warn('保存页面状态失败:', error);
    }
  };

  const getAnsweredQuestions = (examType: string): number[] => {
    if (examType === 'writte') {
      const result: number[] = [];
      const writteAnswers = store.ExamStore.correctWritte;
      writteAnswers.forEach((answer, index) => {
        if (answer && answer.trim()) {
          result.push(index + 1);
        }
      });
      return result;
    }

    const result: number[] = [];
    const answers = store.AnswerStore.completedAnswers;

    for (let idx = 0; idx < answers.length; idx++) {
      const item = answers[idx];
      const nextItem = answers[idx + 1];

      const currentHasContent = item && typeof item === 'object' && String(item.content || '').trim();
      const nextIsDoubleChoicePlaceholder = nextItem === '';

      if (currentHasContent && nextIsDoubleChoicePlaceholder) {
        result.push(idx + 1);
        result.push(idx + 2);
      } else if (currentHasContent) {
        result.push(idx + 1);
      }
    }

    return result;
  };

  const [correctAnswers, setCorrectAnswers] = useState<number[]>(() =>
    getAnsweredQuestions(type)
  );

  useEffect(() => {
    setCurren(store.ExamStore.currentExamIndex);

    const disposeIndex = reaction(
      () => store.ExamStore.currentExamIndex,
      (index) => setCurren(index)
    );
    const disposeAnswers = reaction(
      () =>
        type === 'writte'
          ? store.ExamStore.correctWritte.slice()
          : JSON.stringify(store.AnswerStore.completedAnswers),
      () => {
        setCorrectAnswers(getAnsweredQuestions(type));
      }
    );

    setTimeout(() => setCorrectAnswers(getAnsweredQuestions(type)), 0);

    return () => {
      disposeIndex();
      disposeAnswers();
    };
  }, [type]);

  const maxTotal = getMaxTotal();

  return (
    <div className="nav">
      <div className="paginaction">
        {PageArr.map((item, index) => (
          <ul key={index}>
            <span className="part-label">{item.title}</span>
            {item.questionArr.map((e, i) => {
              const isCurrent = e === curren;
              const isAnswered = correctAnswers.includes(e);
              const btnClass = [
                isAnswered ? 'selectedAnswer' : '',
                isCurrent ? 'currentQuestion' : '',
              ].filter(Boolean).join(' ');

              return (
                <li key={e}>
                  <button
                    className={btnClass}
                    type="button"
                    onClick={() => activeAction(e)}
                  >
                    {e}
                  </button>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
      <div className="footerRight">
        <Space>
          <Button
            size="large"
            className="navButton"
            icon={<ArrowLeftOutlined style={{ fontSize: "32px" }} />}
            onClick={() => handleArrowAction("left")}
            disabled={curren <= 1 || maxTotal === 0}
          ></Button>
          <Button
            size="large"
            className="navButton"
            icon={<ArrowRightOutlined style={{ fontSize: "32px" }} />}
            disabled={curren >= maxTotal || maxTotal === 0}
            onClick={() => handleArrowAction("right")}
          ></Button>
        </Space>
      </div>
    </div>
  );
}

export default observer(footerNav);