//axios的封装处理
import axios from "axios"
import { getToken, removeToken } from "./token"
import router from "../router"
import { message } from "antd"
//1.根域名配置
//2.超时时间
//3.请求拦截器/响应拦截器

const request = axios.create({
    baseURL: 'http://111.230.5.159:8668',
    timeout: 5000
})

let isRedirectingToLogin = false

const createAuthError = (errorMessage) => {
    const error = new Error(errorMessage || "用户没有权限访问")
    error.isAuthError = true
    return error
}

const isAuthError = (error) => {
    return Boolean(error?.isAuthError)
}

const redirectToLogin = () => {
    removeToken()
    if (!isRedirectingToLogin) {
        isRedirectingToLogin = true
        message.warning("用户没有权限访问，请重新登录")
        Promise.resolve(router.navigate('/login')).finally(() => {
            isRedirectingToLogin = false
        })
    }
}

request.interceptors.request.use((config) => {
    //操作config 注入token数据
    //1.获取到token
    //2.按照后端的格式要求做token拼接
    const token = getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
}, (error) => {
    return Promise.reject(error)
})

request.interceptors.response.use((response) => {
    const data = response.data
    if (data?.code === 502 || data?.code === "502") {
        redirectToLogin()
        return Promise.reject(createAuthError(data.message))
    }
    return response
}, (error) => {
    const status = error.response?.status
    if (status === 401 || status === 403 || status === 400) {
        redirectToLogin()
        return Promise.reject(createAuthError(error.response?.data?.message))
    }
    return Promise.reject(error)
})

export { request, isAuthError }
