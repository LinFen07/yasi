import { request } from "../utils/request.js"

const getEssayList = (userId, pageNow = 1, pageSize = 5) => {
  return async () => {
    const response = await request.get('/api/teacher/exam/paper/allIdAndJudge', {
      params: { userId, pageNow, pageSize }
    });
    return response.data;
  };
};

const submitEssayGrade = (id, score, review = '') => {
  return async () => {
    const response = await request.put(`/api/teacher/exam/paper/judgement?id=${id}&score=${score}&review=${encodeURIComponent(review)}`);
    const result = response.data;
    if (result.code !== 0 && result.code !== 1 && result.code !== 200) {
      throw new Error(result.message || '提交失败');
    }
    return result;
  };
};

export { getEssayList, submitEssayGrade };