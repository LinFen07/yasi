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


interface correct {
  key: string;
  question: number;
  answer: string;
  tag: string;
  myAn: string;
  score: string;
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

  //听力录音
  listenAudio: string = '';

  exam: Array<Exam>  = [];
  listenExam: Array<Exam> = [];
  readExam: Array<Exam> = [];
  wirrteExam: Array<Exam> = [];

  //已完成题目数组
  correctListenAnswer: Array<number> = [];

  //听力答案
  correctListen: Array<correct> = [];
  //阅读答案
  correctRead: Array<correct> = [];
  //写作答案
  correctWritte: Array<correct> = [];

  addExam(exam: Array<Exam>) {
    this.exam = exam;
    if(this.exam.length == 7) {
      this.listenExam = this.exam.slice(0,2);
      this.readExam = this.exam.slice(2,5);
      this.wirrteExam = this.exam.slice(5,7);
    }else{
      this.listenExam = this.exam.slice(0,4);
      this.readExam = this.exam.slice(4,7);
      this.wirrteExam = this.exam.slice(7);
    }
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
    console.log(queston);
  }

  updateReadExam(index: number, questionIndex: number, queston: ExamType) {
    this.readExam[index].questionItems[questionIndex] = queston;
  }

  resetcorrectListenAnswer(){
    this.correctListenAnswer = [];
  }

  changeScoreTag(tag: string) {
    this.scoreTag = tag;
  }

  //获取题目类型
  getScoreTag(){
    return this.scoreTag;
  }

  //添加听力录音
  addListenAudio(audio: string) {
    this.listenAudio = audio;
  }
  //获取听力录音
  getListenAudio() {
    return this.listenAudio;
  }

  //判断听力答案
  isTrueListeneAnswer(){
    this.listenExam.forEach((exam, index) => {
      exam.questionItems.forEach((question, questionIndex) => {
        const correctAnswer = question.correct; // 获取正确答案
        const userAnswer = question.answer ? question.answer : ''; // 获取用户答案

        this.correctListen.push({
          key: `${index}-${questionIndex}`,
          question: questionIndex + 1,
          answer: correctAnswer,
          tag: userAnswer === correctAnswer ? 'true' : 'false',
          myAn: userAnswer,
          score: userAnswer === correctAnswer? question.score : '0',
        });
      });
    });
    console.log(this.correctListen);
  }

  //判断阅读答案
  isTrueReadAnswer(){
    this.readExam.forEach((exam, index) => {
      exam.questionItems.forEach((question, questionIndex) => {
        const correctAnswer = question.correct; // 获取正确答案
        const userAnswer = question.answer ? question.answer : ''; // 获取用户答案

        this.correctRead.push({
          key: `${index}-${questionIndex}`,
          question: questionIndex + 1,
          answer: correctAnswer,
          tag: userAnswer === correctAnswer ? 'true' : 'false',
          myAn: userAnswer,
          score: userAnswer === correctAnswer? question.score : '0',
        });
      });
    });
  }
}

export default new ExamStore();