import { post } from '@/utils/request'
export const listPage = (params) => {
  return post(`/api/student/reservation/list?pageNow=${params.pageNow}&pageSize=${params.pageSize}`, params)
}
export function select () {
  return post(`/api/student/reservation/getCurrentUserReservation`)
}
// export const select = (id) => {
//   return post(`/api/student/reservation/select/${id}`)
// }
// 修改select函数为按姓名和电话查询
// export const selectByCondition = (params) => {
//   return request({
//     url: '/api/student/reservation/selectByCondition',
//     method: 'post',
//     data: params  // 使用POST请求体传递参数
//   })
// }
// export function select (params) {
//   return post('/api/student/reservation/selectByCondition', params)
// }
export const update = (params) => {
  return post(`/api/student/reservation/update`, params)
}
export const deleteApi = (ids) => {
  return post(`/api/student/reservation/delete/${ids}`)
}
export const add = (params) => {
  return post('/api/student/reservation/add', params)
}
