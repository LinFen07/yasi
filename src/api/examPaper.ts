import { request } from "@/utils/request";

export const select = async (id: number) => {
  return request({
    url: '/api/student/exam/paper/select/' + id,
    method: 'POST',
  })
}

/** 仅查询试卷正式考试听力音频地址 */
export const queryAudioUrl = async (id: number) => {
  return request({
    url: '/api/student/exam/paper/queryAudioUrl/' + id,
    method: 'POST',
  })
}

/** 解析 queryAudioUrl 接口返回的音频地址 */
export const parseAudioUrlResponse = (res: any): string => {
  if (res?.code !== 1) return '';
  const data = res?.response;
  if (typeof data === 'string') return data;
  return data?.audioFileUrl || '';
}

// 判断考生是否已完成该试卷
export const getExam = async (id: number) => {
  return request({
    url: `/api/student/examassignment/page?userId=${id}`,
    method: 'GET',
  })
}

export const getAdminExam = async () => {
  return request({
    url: '/api/admin/exam/paper/allIdAndName',
    method: 'POST',
  })
}


// export const getExam = async() => {
//   return request({
//       url: '/api/student/exam/paper/pageList',
//       method: 'POST',
//   })
// }