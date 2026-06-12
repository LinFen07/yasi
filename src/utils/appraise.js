import { request } from "../utils/request.js"
const putAppraise = (appraise, id) => {
    return async (dispatch) => {
        const response = await request.put(`/api/teacher/exam/paper/judgement?id=${id}&score=0&review=${encodeURIComponent(appraise)}`);
        console.log(`评价 ${appraise} id ${id}`);
        return response.data;
    };
};

export { putAppraise };