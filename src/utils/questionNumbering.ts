import { Exam, ExamType } from "@/typings/exam";

/**
 * 生成题目ID到连续题号的映射
 * @param exams 考试数据数组
 * @returns 映射对象 {questionId: sequentialNumber}
 */
export function createQuestionNumberMapping(exams: Exam[]): Record<number, number> {
  const mapping: Record<number, number> = {};
  let sequentialNumber = 1;

  exams.forEach((exam) => {
    exam.questionItems.forEach((questionItem) => {
      // 如果题目有 correctArray，则每个正确答案对应一个小题
      if (questionItem.correctArray && questionItem.correctArray.length > 0) {
        questionItem.correctArray.forEach(() => {
          mapping[questionItem.id] = sequentialNumber;
          sequentialNumber++;
        });
      } else {
        // 单个题目
        mapping[questionItem.id] = sequentialNumber;
        sequentialNumber++;
      }
    });
  });

  return mapping;
}

/**
 * 获取题目的模块类型（听力、阅读、写作）
 * @param questionId 题目ID
 * @param listenExam 听力考试数据
 * @param readExam 阅读考试数据
 * @param writeExam 写作考试数据
 * @returns 模块类型字符串
 */
export function getQuestionModuleType(
  questionId: number,
  listenExam: Exam[],
  readExam: Exam[],
  writeExam: Exam[]
): string {
  const targetId = String(questionId);

  const matchQuestion = (examArr: Exam[]) =>
    examArr.some(exam =>
      exam.questionItems.some(item => String(item.id) === targetId)
    );

  if (matchQuestion(listenExam)) return "听力";
  if (matchQuestion(readExam)) return "阅读";
  if (matchQuestion(writeExam)) return "写作";

  return "未知";
}