//用户相关状态管理
import { createSlice } from "@reduxjs/toolkit";
import { removeToken, request } from "../utils/index.js";
import { setToken as _setToken, getToken } from "../utils/index.js";

const userStore = createSlice({
    name: "user",
    //数据状态
    initialState: {
        token: getToken() || '',
        userInfo: JSON.parse(localStorage.getItem('user_message')) || {},
        theme: 'light' // 默认亮色主题
    },
    //同步修改方法
    reducers: {
        setToken(state, action) {
            state.token = action.payload
            _setToken(action.payload) // 使用token.js中的方法
        },
        setUserInfo(state, action) {
            state.userInfo = action.payload
            localStorage.setItem('user_message', JSON.stringify(action.payload))
        },
        clearUserInfo(state) {
            state.token = ''
            state.userInfo = {}
            removeToken()
            localStorage.removeItem('user_message')
            localStorage.removeItem('userId')
            localStorage.removeItem('lastRoute')
        },
        toggleTheme(state) {
            state.theme = state.theme === 'light' ? 'dark' : 'light'
        }
    }
})

//解构出actionCreater
const { setToken, setUserInfo, clearUserInfo, toggleTheme } = userStore.actions

//获取reducer函数（修正拼写错误：reduser → reducer）
const userReducer = userStore.reducer

// 修正：提取Cookie的工具函数（移到外部，作用域正确）
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

//异步方法 完成登录获取token
const fetchLogin = (loginForm) => {
    // 修正：返回异步dispatch函数，内部用try/catch捕获错误
    return async (dispatch) => {
        try {
            // 1. 构造请求数据（修正：password字段从code改为password）
            const requestData = {
                userName: loginForm.userName,
                password: loginForm.code // 核心修正：code → password
            };

            // 2. 发送请求（修正：路径加前缀/，避免拼接错误）
            const response = await request.post('/api/user/login', requestData);

            // 3. Axios响应处理（核心修正：去掉await，直接取data）
            const result = response.data;
            console.log('完整响应:', result); // 打印完整响应以验证数据结构

            // 4. 修正：HTTP状态码判断（Axios用status，且200是成功，无需ok）
            if (response.status !== 200) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }

            // 5. 业务状态码判断
            if (result.code === 1) {
                const userData = result.response;
                const token = userData.token;
                const userInfo = userData.user;
                // 存储userId到localStorage
                if (userInfo.id) {
                    localStorage.setItem('userId', userInfo.id);
                }
                // 存储token和用户信息
                dispatch(setToken(token));
                dispatch(setUserInfo(userInfo));
                return { success: true, message: "登录成功" };
            } else {
                return { success: false, message: result.message || "登录失败" };
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            let errorMsg = "登录异常，请稍后重试";
            if (error.message.includes('HTTP错误')) {
                errorMsg = error.message;
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.message.includes('Network Error')) {
                errorMsg = "网络异常，请检查网络";
            }
            return { success: false, message: errorMsg };
        }
    };
}

// 导出action（保持原样，移除违规的useNavigate）
export { fetchLogin, clearUserInfo, toggleTheme, setUserInfo }

export default userReducer