
import { ExamType, StudentAnswer } from '@/typings/exam';
import { submitAnswer } from '@/api/studentAnswer';
import stores from '@/stores';

export function submitStudentAnswer(questionsArr: ExamType[], index: number, value: string){
  const studentAnswer: StudentAnswer = {
    isCorrect: value == questionsArr[index].correct  ? 1 : 0,
    paperId: stores.ExamStore.paperId,
    questionId: questionsArr[index].id,
    studentAnswer: value,
    studentId: stores.UserStore.userId,
    score: questionsArr[index].score
  }

  submitAnswer(studentAnswer).then((res) => {
    //@ts-ignore
    if(res.code == 200){
      console.log('提交成功');
    }
  }).catch((err) => {
    console.error('提交失败', err);
  })
}
export function submitBlanksAnswer(questionsArr: ExamType, start: number, end: number, type: string){
  const answer = 
    type == 'listen' 
    ? stores.ExamStore.studentListenAnswers.slice(start,end).toString()
    : stores.ExamStore.studentReadAnswers.slice(start,end).toString();
  const score = 
    type == 'listen' 
    ? stores.ExamStore.studentListenScore.slice(start,end).toString()
    : stores.ExamStore.studentReadScore.slice(start,end).toString();

  const studentAnswer: StudentAnswer = {
    isCorrect: answer == questionsArr.correctArray.toString()  ? 1 : 0,
    paperId: stores.ExamStore.paperId,
    questionId: questionsArr.id,
    studentAnswer: answer,
    studentId: stores.UserStore.userId,
    score: score
  }

  submitAnswer(studentAnswer).then((res) => {
    //@ts-ignore
    if(res.code == 200){
      console.log('提交成功');
    }
  }).catch((err) => {
    console.error('提交失败', err);
  })
}