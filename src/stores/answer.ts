import {  makeAutoObservable} from "mobx";

class AnswerStore {
  constructor() {
    makeAutoObservable(this);
  }

  // 打勾题答案数组
  tickAnswers: Array<string> = [];
  //拖拽题答案数组
  dragAnswers: Array<string> = Array(10).fill("");
}

export default new AnswerStore();