import {  makeAutoObservable} from "mobx";

type Items = {
  content: string;
  itemUuid: string;
  prefix: string;
  score: string;
}

interface ExamType {
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
}

class ExamStore {
  exam: Array<Array<ExamType>>  = [];
  currentExamIndex = 1;
  currentExamTitle = 'Part1:';

  constructor() {
    makeAutoObservable(this);
  }

  addExam(exam: any) {
    this.exam.push(exam);
  }

  getExam() {
    return this.exam[this.exam.length - 1];
  }

  changeCurrent(current: number) {
    this.currentExamIndex = current;
  }

  changeCurrentTitle(title: string) {
    this.currentExamTitle = title;
  }
};

export default new ExamStore();