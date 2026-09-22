/**
 * 页面状态管理工具
 * 用于处理页面刷新后的状态恢复和页面跳转
 */

import stores from '@/stores';

export interface PageState {
  currentExamIndex: number;
  currentExamTitle: string;
  currentPageType: string;
  paperId: number;
}

/**
 * 保存当前页面状态到localStorage
 */
export const savePageState = (pageType: string) => {
  const state: PageState = {
    currentExamIndex: stores.ExamStore.currentExamIndex,
    currentExamTitle: stores.ExamStore.currentExamTitle,
    currentPageType: pageType,
    paperId: stores.ExamStore.paperId,
  };
  
  try {
    localStorage.setItem('examPageState', JSON.stringify(state));
  } catch (error) {
    console.warn('保存页面状态失败:', error);
  }
};

/**
 * 从localStorage恢复页面状态
 */
export const restorePageState = (): PageState | null => {
  try {
    const stateStr = localStorage.getItem('examPageState');
    if (stateStr) {
      return JSON.parse(stateStr);
    }
  } catch (error) {
    console.warn('恢复页面状态失败:', error);
  }
  return null;
};

/**
 * 清除页面状态
 */
export const clearPageState = () => {
  try {
    localStorage.removeItem('examPageState');
  } catch (error) {
    console.warn('清除页面状态失败:', error);
  }
};

/**
 * 检查当前URL是否与保存的页面状态匹配
 */
export const isPageStateValid = (currentPageType: string): boolean => {
  const savedState = restorePageState();
  if (!savedState) return false;
  
  return savedState.currentPageType === currentPageType && 
         savedState.paperId === stores.ExamStore.paperId;
};

/**
 * 根据页面类型和题目索引计算正确的页面状态
 */
export const calculatePageState = (pageType: string, examIndex: number) => {
  let exam: any[] = [];
  
  switch (pageType) {
    case 'listen':
      exam = stores.ExamStore.getListenExam();
      break;
    case 'read':
      exam = stores.ExamStore.getReadExam();
      break;
    case 'writte':
      exam = stores.ExamStore.getWritteExam();
      break;
    default:
      return null;
  }

  // 计算题目范围和对应的Part
  let prevLen = 0;
  for (let i = 0; i < exam.length; i++) {
    let allLen = 0;
    for (let j = 0; j < exam[i].questionItems.length; j++) {
      const len = exam[i].questionItems[j].correctArray
        ? exam[i].questionItems[j].correctArray.length
        : 1;
      allLen += len;
    }
    
    if (examIndex <= prevLen + allLen) {
      return {
        partIndex: i,
        partTitle: `Part${i + 1}`,
        questionRange: {
          start: prevLen + 1,
          end: prevLen + allLen
        }
      };
    }
    
    prevLen += allLen;
  }
  
  return null;
};

/**
 * 更新FooterNav的状态以匹配当前页面
 */
export const syncFooterNavState = (pageType: string) => {
  const currentIndex = stores.ExamStore.currentExamIndex;
  const pageState = calculatePageState(pageType, currentIndex);
  
  if (pageState) {
    stores.ExamStore.changeCurrentTitle(pageState.partTitle);
    
    // 根据页面类型设置标题说明
    let headTitleExpain = '';
    if (pageType === 'listen') {
      headTitleExpain = ` Questions ${pageState.questionRange.start} - ${pageState.questionRange.end}`;
    } else if (pageType === 'read') {
      headTitleExpain = ` Read the passage below and answer questions ${pageState.questionRange.start} - ${pageState.questionRange.end}`;
    } else if (pageType === 'writte') {
      headTitleExpain = '';
    }
    
    stores.ExamStore.changeTitleExpain(headTitleExpain);
  }
};

/**
 * 页面刷新后的状态恢复处理
 */
export const handlePageRefresh = (currentPageType: string) => {
  // 检查是否有有效的保存状态
  if (isPageStateValid(currentPageType)) {
    // 同步FooterNav状态
    syncFooterNavState(currentPageType);
    console.log('页面状态已恢复:', {
      pageType: currentPageType,
      examIndex: stores.ExamStore.currentExamIndex,
      examTitle: stores.ExamStore.currentExamTitle
    });
  } else {
    // 如果没有有效状态，重置为默认状态
    stores.ExamStore.changeCurrent(1);
    stores.ExamStore.changeCurrentTitle('Part1');
    syncFooterNavState(currentPageType);
    console.log('使用默认页面状态');
  }
  
  // 保存当前状态
  savePageState(currentPageType);
};