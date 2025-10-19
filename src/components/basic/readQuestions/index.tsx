import "./index.scss";
import { useEffect, useRef, useState } from "react";
import parse from "html-react-parser";
import stores from "@/stores";
import { observer } from "mobx-react";
import { createInput } from "@/utils/helper/createInput";
import Questions from "@/components/basic/questions";

const readQuestions = () => {
  const examTitle = stores.ExamStore.currentExamTitle;
  const exam = stores.ExamStore.getReadExam();
  const [readArr, setReadArr] = useState<any | undefined>(exam?.[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const index = +examTitle[4] - 1;
    setReadArr(exam[index]);
    if (containerRef.current) {
      createInput(exam, "read", containerRef.current);
    }
    // 在阶段切换或组件卸载时释放解析变量与容器内容，避免内存占用
    return () => {
      setReadArr(undefined);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [examTitle, exam]);

  // 提取span纯文本的工具函数（排除输入框相关span）
  const extractSpanText = (node: any): string => {
    // 1. 排除输入框容器span（gapfilling-span需保留结构，否则输入功能失效）
    if (
      node.type === "tag" &&
      node.name === "span" &&
      node.attribs.class?.includes("gapfilling-span")
    ) {
      return ""; // 不处理，保留原结构
    }
    // 2. 递归提取所有标签的文本内容（包括嵌套在span里的子元素）
    let text = "";
    if (node.type === "text") {
      text += node.data; // 直接取文本节点内容
    } else if (node.type === "tag" && node.children) {
      node.children.forEach((child: any) => {
        text += extractSpanText(child); // 递归处理子节点
      });
    }
    return text;
  };

  // 安全解析 HTML 内容的函数
  const safeParseHtml = (htmlContent: string) => {
    if (!htmlContent || typeof htmlContent !== 'string') {
      return <div className="error-content">题目内容加载异常</div>;
    }
    
    // 清理 HTML 内容并确保正确的字符编码
    const cleanedHtml = htmlContent.replace(/<\/?em>/g, "");
    
    try {
      return parse(cleanedHtml);
    } catch (error) {
      console.error('HTML 解析错误:', error);
      return <div className="error-content">题目内容解析失败</div>;
    }
  };

  return (
    <div className="readContent">
      <div className="leftContent parsed-name">
        {safeParseHtml(readArr?.name)}
      </div>
      <div className="rightContent" ref={containerRef}>
        <Questions exam={exam} />
      </div>
    </div>
  );
};

export default observer(readQuestions);