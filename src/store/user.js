//用户相关状态管理
import { createSlice } from "@reduxjs/toolkit";
import { removeToken, request } from "../utils/index.js";
import { setToken as _setToken, getToken } from "../utils/index.js";
import axios from 'axios';
const userStore = createSlice({
    name: "user",
    //数据状态
    initialState: {
        token: getToken() || '',
        userInfo: {},
        theme: 'light' // 默认亮色主题
    },
    //同步修改方法
    reducers: {
        setToken(state, action) {
            state.token = action.payload
            //localstorage存一份
            _setToken(action.payload)
        },
        setUserInfo(state, action) {
            state.userInfo = action.payload
            localStorage.setItem('user_message', JSON.stringify(action.payload))
        },
        clearUserInfo(state) {
            state.token = ''
            state.userInfo = {}
            removeToken()
        },
        toggleTheme(state) {
            state.theme = state.theme === 'light' ? 'dark' : 'light'
        }
    }
})

//解构出actionCreater
const { setToken, setUserInfo, clearUserInfo, toggleTheme } = userStore.actions

//获取reduser函数
const userReducer = userStore.reducer

// const data = { "userName": "teacher", "password": "123456" };

//异步方法 完成登录获取token
const fetchLogin = (loginForm) => {
    return async (dispatch) => {
        // 发送请求
        const response = await fetch('http://120.24.144.113:8668/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginForm),
        });

        // 检查HTTP状态码
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }

        // 解析JSON数据
        const result = await response.json();
        console.log('完整响应:', result); // 打印完整响应以验证数据结构

        // 安全访问嵌套字段并dispatch所有用户数据
        // if (result?.response) {
        // console.log('用户数据:', result.response);
        // const jsessionid = getCookie('JSESSIONID');
        // console.log('获取到的JSESSIONID:', jsessionid);
        // if (jsessionid) {
        //     dispatch(setToken(jsessionid));
        // } else {
        //     console.error('未获取到JSESSIONID');
        // }
        dispatch(setUserInfo(result.response)); // 假设setUserInfo能接受整个用户对象作为参数
    };

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
}

export { fetchLogin, clearUserInfo, toggleTheme, setUserInfo }

export default userReducer
