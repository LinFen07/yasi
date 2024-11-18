import { request } from "@/utils/request";

export const select = async(id: number) => {
    return request({
        url: '/api/student/exam/paper/select/' + id,
        method: 'POST',
      })
}