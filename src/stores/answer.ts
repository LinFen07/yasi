import {  makeAutoObservable} from "mobx";
import { StudentAnswer } from '@/typings/exam'

class AnswerStore {
  constructor() {
    makeAutoObservable(this);
  }

  // 打勾题答案数组
  tickAnswers: Array<string> = [];
  //拖拽题答案数组
  dragAnswers: Array<string> = Array(10).fill("");

  //已完成的题目
  completedAnswers: Array<StudentAnswer> = Array(41).fill('');

  //改变答案
  changeAnswer(index: number, answer: StudentAnswer) {
    this.completedAnswers[index] = answer;
  }
}

export default new AnswerStore();