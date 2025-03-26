import {  makeAutoObservable} from "mobx";

type Items = {
  content: string;
  itemUuid: string;
  prefix: string;
  score: string;
}

export interface Exam {
  name: string;
  questionItems: Array<ExamType>;
}

export interface ExamType {
  analyze: string;
  correct: string;
  correctArray: string[];
  difficult: number;
  gradeLevel: number;
  id: number;
  itemOrder: number;
  items: Array<Items>;
  questionType: string;
  score: string;
  subjectId: number;
  title: string;
  answer: string | null;
}

// export interface ReadExamType {
//   content: string;
//   questions: Array<ExamType>;
// }

interface correct {
  answer: string | null;
  true: string;
  score: number;
}

class ExamStore {

  constructor() {
    makeAutoObservable(this);
  }

  //当前题目索引
  currentExamIndex = 1;
  currentExamTitle = 'Part1:';

  //字体大小
  FontSize = 18;

  //分数标签
  scoreTag = '听力报告';

  exam: Array<Exam>  = [];
  listenExam: Array<Exam> = [];
  readExam: Array<Exam> = [];
  wirrteExam: Array<Exam> = [];

  //已完成题目数组
  correctListenAnswer: Array<number> = [];

  addExam(exam: Array<Exam>) {
    this.exam = exam;
    this.listenExam = this.exam.slice(0,2);
    this.readExam = this.exam.slice(2,5);
    this.wirrteExam = this.exam.slice(5,7);
    console.log(this.listenExam);
  }

  getListenExam(){
    return this.listenExam;
  }

  getReadExam(){
    return this.readExam;
  }

  getWritteExam(){
    return this.wirrteExam;
  }

  changeCurrent(current: number) {
    this.currentExamIndex = current;
  }

  changeCurrentTitle(title: string) {
    this.currentExamTitle = title;
  }

  //改变字体大小
  changeFontSize(size: number) {
    this.FontSize = size;
  }

  updateListenExam(index: number, questionIndex: number, queston: ExamType) {
    this.listenExam[index].questionItems[questionIndex] = queston;
  }

  updateReadExam(index: number, questionIndex: number, queston: ExamType) {
    this.readExam[index].questionItems[questionIndex] = queston;
  }

  resetcorrectListenAnswer(){
    this.correctListenAnswer = [];
  }
}

export default new ExamStore();