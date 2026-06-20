import axios from 'axios'
import vue from 'vue'

const IMAGE_UPLOAD_URL = '/api/upload'
const MAX_IMAGE_SIZE = 3 * 1024 * 1024

function handleUploadResponse (res) {
  const data = res.data
  // wangEditor 格式：{ errno: 0, data: { url, fileUrl, id } }
  if (data.errno !== undefined) {
    if (data.errno !== 0) {
      return Promise.reject(data)
    }
    return data
  }
  if (data.code === 401 || data.code === 502) {
    vue.prototype.$$router.push({ path: '/login' })
    return Promise.reject(data)
  }
  if (data.code === 500 || data.code === 501) {
    return Promise.reject(data)
  }
  return data
}

export default {
  upload: (file) => {
    const formData = new FormData()
    // 后端兼容 file / filedata / upFile / wangeditor-uploaded-image
    formData.append('file', file)
    return axios.request({
      baseURL: process.env.VUE_APP_URL,
      url: IMAGE_UPLOAD_URL,
      method: 'post',
      withCredentials: true,
      timeout: 60000,
      data: formData,
      headers: { 'request-ajax': true }
    }).then(handleUploadResponse)
  },
  getImageUrl (response) {
    if (!response) return null
    // wangEditor 格式
    if (response.errno === 0 && response.data) {
      return response.data.fileUrl || response.data.url || null
    }
    // RestResponse 格式
    if (response.code === 1 && response.response) {
      return response.response.fileUrl || response.response.url || null
    }
    return null
  },
  isUploadSuccess (response) {
    if (!response) return false
    if (response.errno === 0) return true
    if (response.code === 1) return true
    return false
  },
  MAX_IMAGE_SIZE
}
