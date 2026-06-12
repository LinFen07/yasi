import { post, get, deleteRequest } from '@/utils/request'

export default {
  page: params => post('/api/admin/dict/page', params),
  update: params => post('/api/admin/dict/update', params),
  add: params => post('/api/admin/dict/add', params),
  delete: id => deleteRequest(`/api/admin/dict/delete/${id}`),
  findById: id => get(`/api/admin/dict/${id}`),
  findByType: type => get(`/api/admin/dict/type/${type}`),
  findByTypeAndKey: (key, type) => get(`/api/admin/dict/typeAndKey?key=${key}&type=${type}`),
  findByTypeAndValue: (type, value) => get(`/api/admin/dict/typeAndValue?type=${type}&value=${value}`)
}
