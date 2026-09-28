<template>
  <div></div>
</template>

<script>
import cacheApi from '@/api/cache'

export default {
  created () {
    cacheApi.clear().then(res => {
      console.log('清理缓存返回:', res)
      this.$message.success('缓存清理成功')
      this.$router.push({ path: '/dashboard' })
    }).catch(() => {
      this.$router.push({ path: '/dashboard' })
    })
  }
}
</script>
