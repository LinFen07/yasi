import { request } from "@/utils/request";

export const fetchRegister = async(loginForm: Object) => {
    return request({
        url: '/api/student/user/exam/register',
        method: 'POST',
        data: loginForm
      })
}

export const getExamMeal = async(pageSize: number, pageNum: number) => {
  return request({
    url: '/api/student/dict/page',
    method: 'POST',
    data: {
      pageSize,
      pageNum
    }
  })
}