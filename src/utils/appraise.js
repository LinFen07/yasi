// import axios from "axios";

// const putAppraise = (appraise, id) => {
//     return async () => {
//         const response = await axios.put('http://120.24.144.113:8668/api/teacher/examassignment/addAppraise', {
//             appraise: '整体不错',
//             id: 1
//         });
//         console.log(`评价 ${appraise} id ${id}`)
//         console.log(response)
//     };
// };

// export { putAppraise }
import axios from "axios";

const putAppraise = (appraise, id) => {
    return async () => {
        try {
            const response = await axios.post(`http://120.24.144.113:8668/api/teacher/examassignment/addAppraise?appraise=${appraise}&id=${id}`);
            console.log(`评价 ${appraise} id ${id}`);
            console.log(response);
        } catch (error) {
            console.error('请求出错:', error);
        }
    };
};

export { putAppraise };    