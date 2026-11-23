import { request } from "@/utils/request";

export const select = async (id: number) => {
  return request({
    url: "/api/student/exam/paper/select/" + id,
    method: "POST",
  });
};

/** 试卷听力音频流式地址（支持 Range，无需鉴权） */
export const getStreamAudioUrl = (id: number): string => {
  const base =
    process.env.NODE_ENV === "production"
      ? "http://111.230.5.159:8668"
      : "http://111.230.5.159:8668";
  return `${base}/api/student/exam/paper/streamAudio/${id}`;
};

/**
 * 考前说明音频直链（阿里云 OSS）
 * listen / read / writte 三段说明音频统一走 OSS，
 * 避免考试开始瞬间所有考生并发回源压垮服务器出口。
 */
const INSTRUCTION_AUDIO_DIRECT_URL: Record<string, string> = {
  listen: "https://yasi-api-exam.oss-cn-guangzhou.aliyuncs.com/audio/listen.mp3",
  read: "https://yasi-api-exam.oss-cn-guangzhou.aliyuncs.com/audio/read.mp3",
  writte: "https://yasi-api-exam.oss-cn-guangzhou.aliyuncs.com/audio/writing.mp3",
};

export const getExamInstructionMediaUrl = (type: string): string => {
  return INSTRUCTION_AUDIO_DIRECT_URL[type] || "";
};

// 判断考生是否已完成该试卷
export const getExam = async (id: number) => {
  return request({
    url: `/api/student/examassignment/page?userId=${id}`,
    method: "GET",
  });
};

export const getAdminExam = async () => {
  return request({
    url: "/api/admin/exam/paper/allIdAndName",
    method: "POST",
  });
};
