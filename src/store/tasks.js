// 任务相关状态管理
import { createSlice } from "@reduxjs/toolkit";
import axios from 'axios';

const tasksStore = createSlice({
  name: "tasks",
  initialState: {
    tasks: [
      {
        id: 1,
        name: '期中考试',
        total: 200,
        evaluated: 125,
        status: 'in-progress',
        received: true
      },
      {
        id: 2,
        name: '单元测试',
        total: 150,
        evaluated: 98,
        status: 'in-progress',
        received: true
      },
      {
        id: 3,
        name: '随堂测验',
        total: 100,
        evaluated: 75,
        status: 'in-progress',
        received: true
      },
      {
        id: 4,
        name: '期末考试',
        total: 300,
        evaluated: 0,
        status: 'pending',
        received: false
      },
      {
        id: 5,
        name: '第一次月考',
        total: 180,
        evaluated: 180,
        status: 'completed',
        received: true
      },
      {
        id: 6,
        name: '小测验',
        total: 80,
        evaluated: 80,
        status: 'completed',
        received: true
      }
    ],
    currentTask: null,
    article: [],
    paper: []
  },
  reducers: {
    setTasks(state, action) {
      state.tasks = action.payload
    },
    setCurrentTask(state, action) {
      state.currentTask = action.payload
    },
    updateTask(state, action) {
      state.tasks = state.tasks.map(task =>
        task.id === action.payload.id ? action.payload : task
      )
    },
    setArticle(state, action) {
      state.article = action.payload
      localStorage.setItem('article', JSON.stringify(action.payload))
    },
    setPaper(state, action) {
      state.paper = action.payload
      localStorage.setItem('paperInfo', JSON.stringify(action.payload));
    }
  }
})

const { setTasks, setCurrentTask, updateTask, setPaper, setArticle } = tasksStore.actions;
const fetchArticle = () => {
  return async (dispatch) => {
    const response = await axios.get('http://120.24.144.113:8668/api/teacher/exam/paper/allIdAndJudge');
    // 从 tasksStore.actions 中获取 setArticle 并调用
    dispatch(setArticle(response.data));
  };
};

const paperId = 2; // 请将此 ID 替换为实际的试卷 ID

// 定义接口地址
const apiUrl = `http://120.24.144.113:8668/api/teacher/exam/paper/select/${paperId}`;

// 定义获取作文信息的函数
const fetchCompositionInfo = () => {
  return async (dispatch) => {
    const response = await axios.post(apiUrl);
    const compositionInfo = response.data;
    // console.log('作文信息:', compositionInfo);
    dispatch(setPaper(compositionInfo));
  };
};
// 导出相关 action
export { setTasks, setCurrentTask, updateTask, setPaper, fetchCompositionInfo, fetchArticle, setArticle };
export default tasksStore.reducer;
