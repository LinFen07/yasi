import { get } from '@/utils/request'

export default {
  selectTeacherAssignmentById: (id) =>
    get(`/api/admin/teacherAssignment/select/${id}`)
}
