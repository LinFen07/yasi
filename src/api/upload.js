// import { post } from '@/utils/request'

// export default {
//   // upload: () => post('/api/admin/upload/configAndUpload')
//   upload: (params) => post('/api/admin/file/uploadImageFile', params)
// }

// api/upload.js
import { post } from '@/utils/request'

export default {
  upload: (file) => {
    const formData = new FormData()
    formData.append('filedata', file) // 关键修改：使用filedata作为参数名
    return post('/api/admin/file/uploadImageFile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
