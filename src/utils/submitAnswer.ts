
import { ExamType, StudentAnswer } from '@/typings/exam';
import stores from '@/stores';

const studentAnswer: StudentAnswer = {
  isCorrect: 0,
  paperId: stores.ExamStore.paperId,
  questionId: 0,
  studentAnswer: '1',
  studentId: stores.UserStore.userId,
  score: '0'
}
export function submitStudentSelectAnswer(
  questionsArr: ExamType[], 
  index: number, 
  value: string, 
  questionIndex: number
): void {
  Object.assign(studentAnswer, {
    isCorrect: value == questionsArr[index].correct  ? 1 : 0,
    questionId: questionsArr[index].id,
    studentAnswer: value,
    score: questionsArr[index].score
  });

  stores.AnswerStore.changeAnswer(questionIndex, studentAnswer);
}
export function submitStudentBlankAnswer(
  questionArr: ExamType, 
  i: number, 
  prevCount: number, 
  value: string, 
  correctIndex: number
): void {
  Object.assign(studentAnswer, {
    isCorrect: value == questionArr.correctArray[correctIndex]  ? 1 : 0,
    questionId: questionArr.items[correctIndex].itemUuid,
    studentAnswer: value,
    score: value == questionArr.correctArray[correctIndex] ? questionArr.items[correctIndex].score : '0',
  });
  stores.AnswerStore.changeAnswer(prevCount + i + 1, studentAnswer);
}