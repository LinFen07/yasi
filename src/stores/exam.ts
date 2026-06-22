import { makeAutoObservable, reaction, runInAction } from "mobx";
import { Exam, ExamType } from "@/typings/exam";
import { getStreamAudioUrl } from "@/api/examPaper";

class ExamStore {
  paperId = 0;

  currentExamIndex = 1;
  currentExamTitle = "Part1";
  titleExpain = "";

  currentPageType = "listen";

  FontSize = 18;

  listenAudio: string = "";
  audioVolume = 30;

  exam: Array<Exam> = [];
  listenExam: Array<Exam> = [];
  readExam: Array<Exam> = [];
  wirrteExam: Array<Exam> = [];
  currentExam: Array<Exam> = [];

  correctListenAnswer: Array<number> = [];

  studentListenAnswers: Array<string> = Array(50).fill("");
  studentReadAnswers: Array<string> = Array(50).fill("");

  correctWritte: Array<string> = Array(2).fill("");

  /** ???????? */
  audioStreamReadyMap: Record<number, boolean> = {};
  audioErrorMap: Record<number, string> = {};
  audioCheckTrigger: number = 0;

  private streamCheckPromises = new Map<number, Promise<boolean>>();

  constructor() {
    makeAutoObservable(this);
    this.loadFromLocalStorage();

    reaction(
      () => JSON.stringify(this),
      () => {
        this.saveToLocalStorage();
      }
    );
  }

  fullReset() {
    const data = {
      paperId: this.paperId,
      currentExamIndex: this.currentExamIndex,
      currentExamTitle: this.currentExamTitle,
      currentPageType: this.currentPageType,
      FontSize: this.FontSize,
      listenAudio: this.listenAudio,
      exam: this.exam,
      listenExam: this.listenExam,
      readExam: this.readExam,
      wirrteExam: this.wirrteExam,
      currentExam: this.currentExam,
      correctListenAnswer: this.correctListenAnswer,
      studentListenAnswers: Array(50).fill(""),
      studentReadAnswers: Array(50).fill(""),
      correctWritte: Array(2).fill(""),
      audioVolume: this.audioVolume,
    };
    localStorage.setItem("examStore", JSON.stringify(data));
  }

  saveToLocalStorage() {
    const data = {
      paperId: this.paperId,
      currentExamIndex: this.currentExamIndex,
      currentExamTitle: this.currentExamTitle,
      currentPageType: this.currentPageType,
      FontSize: this.FontSize,
      listenAudio: this.listenAudio,
      exam: this.exam,
      listenExam: this.listenExam,
      readExam: this.readExam,
      wirrteExam: this.wirrteExam,
      currentExam: this.currentExam,
      correctListenAnswer: this.correctListenAnswer,
      studentListenAnswers: this.studentListenAnswers,
      studentReadAnswers: this.studentReadAnswers,
      correctWritte: this.correctWritte,
      audioVolume: this.audioVolume,
    };
    localStorage.setItem("examStore", JSON.stringify(data));
  }

  loadFromLocalStorage() {
    const data = localStorage.getItem("examStore");
    if (data) {
      const parsedData = JSON.parse(data);
      this.paperId = parsedData.paperId || 0;
      this.currentExamIndex = parsedData.currentExamIndex || 1;
      this.currentExamTitle = parsedData.currentExamTitle || "Part1";
      this.currentPageType = parsedData.currentPageType || "listen";
      this.FontSize = parsedData.FontSize || 18;
      this.listenAudio = parsedData.listenAudio || "";
      this.exam = parsedData.exam || [];
      this.listenExam = parsedData.listenExam || [];
      this.readExam = parsedData.readExam || [];
      this.wirrteExam = parsedData.wirrteExam || [];
      this.currentExam = parsedData.currentExam || [];
      this.correctListenAnswer = parsedData.correctListenAnswer || [];
      this.studentListenAnswers =
        parsedData.studentListenAnswers || Array(50).fill("");
      this.studentReadAnswers =
        parsedData.studentReadAnswers || Array(50).fill("");
      this.correctWritte = parsedData.correctWritte || Array(2).fill("");
      this.audioVolume = parsedData.audioVolume || 30;
    }
  }

  resetLocalStorage() {
    localStorage.removeItem("examStore");
  }

  changeCurrentExam(exam: Array<Exam>) {
    this.currentExam = exam;
  }

  changePaperId(id: number) {
    this.paperId = id;
  }

  addExam(exam: Array<Exam>) {
    this.exam = exam;
    if (this.exam.length == 7) {
      this.listenExam = this.exam.slice(0, 2);
      this.readExam = this.exam.slice(2, 5);
      this.wirrteExam = this.exam.slice(5, 7);
    } else {
      this.listenExam = this.exam.slice(0, 4);
      this.readExam = this.exam.slice(4, 7);
      this.wirrteExam = this.exam.slice(7);
    }
    this.saveToLocalStorage();
  }

  getListenExam() {
    return this.listenExam;
  }

  getReadExam() {
    return this.readExam;
  }

  getWritteExam() {
    return this.wirrteExam;
  }

  changeCurrent(current: number) {
    this.currentExamIndex = current;
  }

  changeCurrentTitle(title: string) {
    this.currentExamTitle = title;
  }

  changeTitleExpain(title: string) {
    this.titleExpain = title;
  }

  changeCurrentPageType(pageType: string) {
    this.currentPageType = pageType;
  }

  changeFontSize(size: number) {
    this.FontSize = size;
  }

  updateListenExam(index: number, questionIndex: number, queston: ExamType) {
    this.listenExam[index].questionItems[questionIndex] = queston;
  }

  updateReadExam(index: number, questionIndex: number, queston: ExamType) {
    this.readExam[index].questionItems[questionIndex] = queston;
  }

  resetcorrectListenAnswer() {
    this.correctListenAnswer = [];
  }

  addListenAudio(audio: string) {
    this.listenAudio = audio;
  }

  getListenAudio() {
    return this.listenAudio;
  }

  changeStudentListenAnswer(index: number, answer: string) {
    this.studentListenAnswers[index] = answer;
  }

  changeStudentReadAnswer(index: number, answer: string) {
    this.studentReadAnswers[index] = answer;
  }

  changeWritteAnswer(index: number, answer: string) {
    this.correctWritte[index] = answer;
  }

  changeAusioVolume(volume: number) {
    this.audioVolume = volume;
  }

  /** ???????????? */
  getListenAudioSrc(): string {
    if (this.paperId === 0) return "";
    return getStreamAudioUrl(this.paperId);
  }

  isAudioReadyForStart(paperId?: number): boolean {
    const id = paperId ?? this.paperId;
    if (!id) return false;
    return this.audioStreamReadyMap[id] === true;
  }

  getAudioError(paperId?: number): string {
    const id = paperId ?? this.paperId;
    if (!id) return "";
    return this.audioErrorMap[id] || "";
  }

  /** ?????????? */
  async checkListenStreamAvailable(paperId: number): Promise<boolean> {
    if (!paperId) return false;
    if (this.audioStreamReadyMap[paperId]) return true;

    const existing = this.streamCheckPromises.get(paperId);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const url = getStreamAudioUrl(paperId);
        const res = await fetch(url, { headers: { Range: "bytes=0-0" } });
        const ok = res.ok || res.status === 206;

        runInAction(() => {
          if (ok) {
            this.audioStreamReadyMap[paperId] = true;
            this.audioErrorMap[paperId] = "";
          } else {
            this.audioErrorMap[paperId] = `????? (${res.status})`;
          }
          this.audioCheckTrigger++;
        });

        return ok;
      } catch (error: any) {
        runInAction(() => {
          this.audioErrorMap[paperId] = error?.message || "??????";
          this.audioCheckTrigger++;
        });
        return false;
      } finally {
        this.streamCheckPromises.delete(paperId);
      }
    })();

    this.streamCheckPromises.set(paperId, promise);
    return promise;
  }
}

export default new ExamStore();
