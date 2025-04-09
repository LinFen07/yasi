//组合redux子模块 + 导出store实例
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./user";
import tasksReducer from "./tasks";
const store = configureStore({
    reducer: {
        user: userReducer,
        tasks: tasksReducer
    }
})

export default store