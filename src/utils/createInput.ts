
import stores from '@/stores';
import type { Exam } from '@/stores/exam';
import { runInAction } from 'mobx';
import  {computedPrevCount, computedBlanksPrevCount}  from '@/utils/computedPrevCount';
export function createInput(exam: Array<Exam>) {
  let prevCount = computedPrevCount(stores.ExamStore.currentExamTitle, exam);
  // let prevCount = computedBlanksPrevCount(pre, stores.ExamStore.currentExamTitle, exam);
  const index = +stores.ExamStore.currentExamTitle.slice(4, stores.ExamStore.currentExamTitle.length - 1) - 1;
  let currIndex = 0;
  let timerId = setTimeout(() => {
    const span = document.querySelectorAll('.gapfilling-span');
    if (span.length === 0) return;
    for(let j = 0; j < exam[index].questionItems.length; j++){
      const questionArr = exam[index].questionItems[j];
      if(questionArr.questionType == '4'){
        MyInput(currIndex, span, prevCount, questionArr.items.length + currIndex);
        currIndex += questionArr.items.length;
      }else if(questionArr.questionType == '2'){
        prevCount += questionArr.correctArray.length;
      }else {
        prevCount += 1;
      }
    } 
  }, 0)
    return () => clearTimeout(timerId);
}

function MyInput(index: number, span: any, prevCount: number, len: number) {
  for (let i = index; i < len; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';

    const input = document.createElement('input');
    input.className = 'textInput';
    input.setAttribute('data-index', (prevCount + i + 1).toString()); // 设置序号

    const placeholder = document.createElement('span');
    placeholder.className = 'placeholder';
    placeholder.innerText = (prevCount + i + 1).toString(); // 显示序号

    // 监听 input 的 focus 和 input 事件
    input.addEventListener('focus', () => {
      placeholder.style.display = 'none';
      stores.ExamStore.changeCurrent(prevCount + i + 1);
    });
    input.addEventListener('blur', () => {
      if (!input.value) {
        placeholder.style.display = 'block';
      }
    });
    input.addEventListener('input', () => {
      if (input.value) {
        placeholder.style.display = 'none';
        runInAction(() => {
          stores.ExamStore.correctListenAnswer.push(prevCount + i + 1);
        });
      } else {
        placeholder.style.display = 'block';
      }
    });

    wrapper.appendChild(placeholder);
    wrapper.appendChild(input);

    span[i].innerHTML = '';
    span[i].appendChild(wrapper);
  }
}