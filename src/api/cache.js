import { postWithLoadTip } from '@/utils/request'
export default {
  clear: query => postWithLoadTip(`/api/admin/cache/clear`, query)
}
