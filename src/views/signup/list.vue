<template>
  <div class="app-container">
    <el-form :model="queryParam" ref="queryForm" :inline="true">
      <el-form-item label="真实姓名">
        <el-input v-model="queryParam.params.realName" placeholder="请输入真实姓名"></el-input>
      </el-form-item>
      <el-form-item label="电话">
        <el-input v-model="queryParam.params.phone" placeholder="请输入电话号码"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <router-link :to="{ path: '/signup/add' }" class="link-left">
          <el-button type="primary">添加</el-button>
        </router-link>
      </el-form-item>
    </el-form>

    <el-table v-loading="listLoading" :data="tableData" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="realName" label="真实姓名" />
      <el-table-column prop="phone" label="电话" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="imagePath" label="图片路径" />
      <el-table-column prop="packageId" label="套餐Id" />
      <el-table-column label="付款方式">
        <template slot-scope="{ row }">
          {{ formatPayType(row.payType) }}
        </template>
      </el-table-column>
      <el-table-column prop="reservationTime" label="预约时间" />
      <el-table-column label="预约状态">
        <template slot-scope="{row}">
          {{ formatStatus(row.status) }}
        </template>
      </el-table-column>
      <el-table-column width="220px" label="操作" align="center">
        <template slot-scope="{row}">
          <router-link :to="{ path: '/signup/edit', query: { id: row.id } }" class="link-left">
            <el-button size="mini">编辑</el-button>
          </router-link>
          <el-button size="mini" type="danger" @click="delSignup(row)" class="link-left">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParam.pageNow" :limit.sync="queryParam.pageSize"
      @pagination="search" />
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import { listPage, select, deleteApi } from '@/api/signup'

export default {
  components: { Pagination },
  data () {
    return {
      queryParam: {
        pageNow: 1,
        pageSize: 10,
        params: {
          email: '',
          id: '',
          packageId: null,
          payId: '',
          payType: '',
          phone: '',
          realName: '',
          reservationTime: '',
          status: '',
          userName: ''
        }
      },
      listLoading: true,
      tableData: [],
      total: 0
    }
  },
  created () {
    let id = this.$route.query.id
    if (id && parseInt(id) !== 0) {
      this.queryParam.params.id = id
    }
    this.search()
  },
  methods: {
    async search () {
      this.listLoading = true
      try {
        const res = await listPage(this.queryParam)
        if (res.code === 1) {
          this.tableData = res.response.items
          this.total = res.response.counts
          this.queryParam.pageNow = res.response.pageNo
          this.queryParam.pageSize = res.response.pageSize
        } else {
          this.$message.error(res.message || '获取数据失败')
        }
      } catch (error) {
        this.$message.error('请求失败')
      } finally {
        this.listLoading = false
      }
    },
    async handleSearch () {
      this.queryParam.pageNow = 1
      const { realName, phone } = this.queryParam.params

      if (realName || phone) {
        try {
          this.listLoading = true
          // 调用修改后的查询接口
          const res = await select({
            realName: realName || undefined,
            phone: phone || undefined
          })

          if (res.code === 1) { // 根据您的API返回码调整
            this.tableData = Array.isArray(res.response) ? res.response : [res.response]
            this.total = this.tableData.length
          } else {
            this.$message.error(res.message || '未找到匹配记录')
          }
        } catch (error) {
          this.$message.error('查询失败: ' + error.message)
        } finally {
          this.listLoading = false
        }
      } else {
        this.search() // 无查询条件时执行普通搜索
      }
    },

    async delSignup (row) {
      try {
        const res = await deleteApi(row.id)
        if (res.code === 0) {
          this.$message.success('删除成功')
          this.search()
        } else {
          this.$message.error(res.message || '删除失败')
        }
      } catch (error) {
        this.$message.error('删除请求失败')
      }
    }
  },
  computed: {
    formatPayType () {
      return (payType) => {
        return payType === 1 ? '微信' : '支付宝'
      }
    },
    formatStatus () {
      return (status) => {
        return status === 1 ? '成功' : '失败'
      }
    }
  }
}
</script>

<style scoped>
.link-left {
  margin-left: 10px;
}
</style>
