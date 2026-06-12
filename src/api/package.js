import { post, get, put, deleteRequest } from '@/utils/request'
export const addNewPackage = (params) => {
  return post('/api/admin/package/add', params)
}
export const getPackagesByPage = (pageNo, pageSize) => {
  return get(`/api/admin/package/page?pageNo=${pageNo}&pageSize=${pageSize}`)
}
export const updatePackage = (params) => {
  return put('/api/admin/package/update', params)
}
export const getPackageById = (packageId) => {
  return get(`/api/admin/package/${packageId}`)
}
export const deletePackage = (packageId) => {
  return deleteRequest(`/api/admin/package/${packageId}`)
}
