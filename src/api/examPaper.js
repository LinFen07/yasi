import { post, get, deleteRequest } from '@/utils/request'

export default {
  pageList: query => post('/api/admin/exam/paper/page', query),
  taskExamPage: query => post('/api/admin/exam/paper/taskExamPage', query),
  edit: query => post('/api/admin/exam/paper/edit', query),
  select: id => post('/api/admin/exam/paper/select/' + id),
  deletePaper: id => post('/api/admin/exam/paper/delete/' + id),
  addAudio: (audioPath, examId) => post(`/api/admin/exam/paper/addAudio?audioPath=${audioPath}&examId=${examId}`),
  allIdAndName: () => get('/api/admin/file/allIdAndName'),
  uploadAudioFile: params => post('/api/admin/file/uploadAudioFile', params),
  allPaper: () => post('/api/admin/exam/paper/allIdAndName'),
  grantPaperToTeacher: (examPaperId, userId) => post(`/api/admin/teacherAssignment/insert?examPaperId=${examPaperId}&userId=${userId}`),
  findList: (pageNow, pageSize) => get(`/api/admin/examassignment/page?pageNow=${pageNow}&pageSize=${pageSize}`),
  // 授权学生试卷
  save: (params) => post(`/api/admin/examassignment/add`, params),
  // 取消授权学生试卷
  delete: (id) => deleteRequest(`/api/admin/examassignment/${id}`),
  // 教师授权试卷列表
  teacherList: (pageNo, pageSize, type) => post(`/api/admin/teacherAssignment/pageList?pageNo=${pageNo}&pageSize=${pageSize}&type=${type}`),
  // 授权教师试卷
  insertTeacherAssignment: (examPaperId, userId) => post(`/api/admin/teacherAssignment/insert?examPaperId=${examPaperId}&userId=${userId}`),
  // 取消授权教师试卷
  // deleteTeacherAssignment: (id) => deleteRequest(`/api/admin/teacherAssignment/delete/${id}`),
  deleteByUserIdAndExamPaperId: (examPaperId, userId) => deleteRequest(`/api/admin/teacherAssignment/deleteByUserIdAndExamPaperId?examPaperId=${examPaperId}&userId=${userId}`),
  // 试卷是否授权？
  isAssign: (examPaperId, userId) => get(`/api/admin/teacherAssignment/isAssign?examPaperId=${examPaperId}&userId=${userId}`),
  // 字典
  findByType: (type) => get(`/api/admin/dict/type/${type}`),
  // 分页查询上传文件列表
  uploadFileList: (pageNo, pageSize, params) => post(`/api/admin/file/uploadFileList?pageNo=${pageNo}&pageSize=${pageSize}`, params),
  getAudioStreamUrl: id => `/api/admin/file/stream/${id}`
}
