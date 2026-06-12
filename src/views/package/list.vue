<template>
  <div class="app-container">
    <el-form :model="queryParam" ref="queryForm" :inline="true">
      <el-form-item label="ID：">
        <el-input v-model="queryParam.id" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">查询</el-button>
        <router-link :to="{ path: '/package/add' }" class="link-left">
          <el-button type="primary">添加</el-button>
        </router-link>
      </el-form-item>
    </el-form>
    <el-table v-loading="listLoading" :data="tableData" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="title" label="套餐名" />
      <el-table-column prop="content" label="内容" />
      <el-table-column prop="createTime" label="创建时间" />
      <el-table-column prop="pirce" label="价格" />
      <el-table-column prop="updateTime" label="更新时间" />
      <el-table-column prop="remark" label="备注" />
      <el-table-column width="220px" label="操作" align="center">
        <template slot-scope="{row}">
          <router-link :to="{ path: '/package/edit', query: { id: row.id } }" class="link-left">
            <el-button size="mini">编辑</el-button>
          </router-link>
          <el-button size="mini" type="danger" @click="deletePackage(row)" class="link-left">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParam.pageNow" :limit.sync="queryParam.pageSize"
      @pagination="search" />
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import { getPackagesByPage, getPackageById, deletePackage } from '../../api/package'

export default {
  components: { Pagination },
  data () {
    return {
      queryParam: {
        pageNow: 1,
        pageSize: 10,
        content: '',
        createTime: '',
        id: '',
        pirce: 0,
        remark: '',
        title: '',
        updateTime: ''
      },
      listLoading: true,
      tableData: [],
      total: 0
    }
  },
  created () {
    let id = this.$route.query.id
    if (id && parseInt(id) !== 0) {
      this.queryParam.id = id
    }
    this.search()
  },
  methods: {
    async search () {
      this.listLoading = true
      const res = await getPackagesByPage(this.queryParam.pageNow, this.queryParam.pageSize)
      this.tableData = res.response.items
      this.total = res.response.counts
      this.queryParam.pageNow = res.response.pageNo
      this.queryParam.pageSize = res.response.pageSize
      this.listLoading = false
    },

    async submitForm () {
      this.queryParam.pageNow = 1
      let id = this.queryParam.id
      if (id && parseInt(id) !== 0) {
        this.listLoading = true
        const res = await getPackageById(id)
        if (res.response) {
          this.total = 1
          this.tableData = [res.response]
        } else {
          this.total = 0
          this.tableData = []
          this.$message.error('未找到相关数据')
        }
        this.listLoading = false
      } else {
        this.total = 0
        this.tableData = []
        this.$message.error('请输入有效的 ID')
      }
    },

    async deletePackage (row) {
      let _this = this
      if (!row.id) {
        _this.$message.error('无效的 ID')
        return
      }
      const res = await deletePackage(row.id)
      if (res.code === 1) {
        _this.$message.success(res.message)
        _this.search()
      } else {
        _this.$message.error(res.message)
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
