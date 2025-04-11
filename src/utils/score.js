import axios from "axios";

const postScore = (id, score) => {
    return async () => {
        const response = await axios.post(`http://120.24.144.113:8668/api/teacher/exam/paper/judg?id=${id}&score=${score}`)
        console.log(`分数 ${score} id ${id}`)
        console.log(response)
    };
};

export { postScore }