import { request } from "@/utils/request";

export const fetchRegister = async(loginForm: Object) => {
    return request({
        url: '/api/student/user/exam/register',
        method: 'POST',
        data: loginForm
      })
}