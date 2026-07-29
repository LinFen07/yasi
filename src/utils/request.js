import axios from 'axios'
import vue from 'vue'

const baseConfig = {
  baseURL: process.env.VUE_APP_URL,
  withCredentials: true,
  timeout: 30000
}

const request = function (loadtip, query) {
  let loading
  if (loadtip) {
    loading = vue.prototype.$loading({
      lock: false,
      text: '正在加载中…',
      spinner: 'el-icon-loading',
      background: 'rgba(0, 0, 0, 0.5)'
    })
  }
  return axios.request(query)
    .then(res => {
      if (loadtip) {
        loading.close()
      }
      const { code } = res.data
      if (code === 401 || code === 502) {
        vue.prototype.$$router.push({ path: '/login' })
        return Promise.reject(res.data)
      } else if (code === 500 || code === 501) {
        return Promise.reject(res.data)
      } else {
        return Promise.resolve(res.data)
      }
    })
    .catch(e => {
      if (loadtip) {
        loading.close()
      }
      vue.prototype.$message.error(e.message)
      return Promise.reject(e.message)
    })
}

const post = function (url, params, loadtip = false) {
  return request(loadtip, {
    ...baseConfig,
    url,
    method: 'post',
    data: params,
    headers: { 'Content-Type': 'application/json', 'request-ajax': true }
  })
}

const postWithLoadTip = function (url, params) {
  return post(url, params, true)
}

const postWithOutLoadTip = function (url, params) {
  return post(url, params, false)
}

const get = function (url, params) {
  return request(false, {
    ...baseConfig,
    url,
    method: 'get',
    params,
    headers: { 'request-ajax': true }
  })
}

const form = function (url, params) {
  return request(false, {
    ...baseConfig,
    url,
    method: 'post',
    data: params,
    headers: { 'Content-Type': 'multipart/form-data', 'request-ajax': true }
  })
}

const put = function (url, params) {
  return request(false, {
    ...baseConfig,
    url,
    method: 'put',
    data: params,
    headers: { 'Content-Type': 'application/json', 'request-ajax': true }
  })
}

const deleteRequest = function (url, params) {
  return request(false, {
    ...baseConfig,
    url,
    method: 'delete',
    params,
    headers: { 'request-ajax': true }
  })
}

export {
  post,
  postWithLoadTip,
  postWithOutLoadTip,
  get,
  put,
  deleteRequest,
  form
}
