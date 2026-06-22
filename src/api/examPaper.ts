import { request } from "@/utils/request";

export const select = async (id: number) => {
  return request({
    url: '/api/student/exam/paper/select/' + id,
    method: 'POST',
  })
}

/** 试卷听力音频流式地址（支持 Range，无需鉴权） */
export const getStreamAudioUrl = (id: number): string => {
  const base = process.env.NODE_ENV === 'production' ? 'http://111.230.5.159:8668' : '';
  return `${base}/api/student/exam/paper/streamAudio/${id}`;
}

/** 考前听力说明音频流式地址（仅 listen） */
export const getInstructionStreamUrl = (): string => {
  const base = process.env.NODE_ENV === 'production' ? 'http://111.230.5.159:8668' : '';
  return `${base}/api/student/exam/paper/streamInstruction/listen`;
}

const INSTRUCTION_AUDIO_DIRECT_URL: Record<string, string> = {
  read: 'http://111.230.5.159:9000/yasi/audio/read.mp3',
  writte: 'http://111.230.5.159:9000/yasi/audio/writing.mp3',
};

export const getExamInstructionMediaUrl = (type: string): string => {
  if (type === 'listen') return getInstructionStreamUrl();
  return INSTRUCTION_AUDIO_DIRECT_URL[type] || '';
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
