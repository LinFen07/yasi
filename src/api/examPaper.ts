import { request } from "@/utils/request";

export const select = async(id: number) => {
    return request({
        url: '/api/student/exam/paper/select/' + id,
        method: 'POST',
      })
}

export const getAdminExam = async() => {
  return request({
      url: '/api/admin/exam/paper/allIdAndName',
      method: 'POST',
  })
}
export const getExam = async() => {
  return request({
      url: '/api/student/exam/paper/pageList',
      method: 'POST',
  })
}