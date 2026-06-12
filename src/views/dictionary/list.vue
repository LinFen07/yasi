<template>
  <div class="app-container">
    <el-form :model="queryParam" ref="queryForm" :inline="true">
      <el-form-item label="查询方式：">
        <el-select v-model="queryParam.searchType" placeholder="请选择查询方式" @change="onSearchTypeChange">
          <el-option value="page" label="分页查询"></el-option>
          <el-option value="type" label="按类型查询"></el-option>
          <el-option value="typeAndKey" label="按类型和键查询"></el-option>
          <el-option value="typeAndValue" label="按类型和值查询"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="字典类型：" v-if="queryParam.searchType !== 'page'">
        <el-input v-model="queryParam.dictType" placeholder="请输入字典类型"></el-input>
      </el-form-item>
      <el-form-item label="字典键：" v-if="queryParam.searchType === 'typeAndKey'">
        <el-input v-model="queryParam.dictKey" placeholder="请输入字典键"></el-input>
      </el-form-item>
      <el-form-item label="字典值：" v-if="queryParam.searchType === 'typeAndValue'">
        <el-input v-model="queryParam.dictValue" placeholder="请输入字典值"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">查询</el-button>
        <el-button @click="resetForm">重置</el-button>
        <router-link :to="{path:'/dictionary/add'}" class="link-left">
          <el-button type="primary">添加</el-button>
        </router-link>
      </el-form-item>
    </el-form>

    <el-table v-loading="listLoading" :data="tableData" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="dictType" label="字典类型" width="150px" />
      <el-table-column prop="dictKey" label="字典键" width="120px" />
      <el-table-column prop="dictValue" label="字典值" width="120px" />
      <el-table-column prop="description" label="描述" min-width="200px" />
      <el-table-column prop="sort" label="排序" width="80px" />
      <el-table-column prop="createTime" label="创建时间" width="160px" />
      <el-table-column prop="updateTime" label="更新时间" width="160px" />
      <el-table-column label="状态" prop="status" width="80px">
        <template slot-scope="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column width="220px" label="操作" align="center">
        <template slot-scope="{row}">
          <router-link :to="{path:'/dictionary/edit', query:{id:row.id}}" class="link-left">
            <el-button size="mini" type="default">编辑</el-button>
          </router-link>
          <el-button size="mini" type="danger" @click="deleteDictionary(row)" class="link-left">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="counts>0 && queryParam.searchType === 'page'" :total="counts" :page.sync="queryParam.pageNum" :limit.sync="queryParam.pageSize"
      @pagination="search" />
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import dictionaryApi from '@/api/dictionary'

export default {
  name: 'DictionaryList',
  components: { Pagination },
  data () {
    return {
      tableData: [],
      counts: 0,
      pageNo: 1,
      listLoading: true,
      queryParam: {
        searchType: 'page', // 默认分页查询
        pageNum: 1,
        pageSize: 10,
        dictType: '',
        dictKey: '',
        dictValue: ''
      }
    }
  },
  created () {
    this.search()
  },
  methods: {
    onSearchTypeChange () {
      // 当查询方式改变时，清空相关字段
      this.queryParam.dictType = ''
      this.queryParam.dictKey = ''
      this.queryParam.dictValue = ''
      this.queryParam.pageNum = 1
    },
    submitForm () {
      this.queryParam.pageNum = 1
      this.search()
    },
    resetForm () {
      this.queryParam = {
        searchType: 'page',
        pageNum: 1,
        pageSize: 10,
        dictType: '',
        dictKey: '',
        dictValue: ''
      }
      this.search()
    },
    search () {
      this.listLoading = true
      // 根据查询方式调用不同的API
      let apiCall
      switch (this.queryParam.searchType) {
        case 'page':
          // 分页查询
          apiCall = dictionaryApi.page({
            pageNum: this.queryParam.pageNum,
            pageSize: this.queryParam.pageSize
          })
          break
        case 'type':
          // 按类型查询
          if (!this.queryParam.dictType) {
            this.$message.warning('请输入字典类型')
            this.listLoading = false
            return
          }
          apiCall = dictionaryApi.findByType(this.queryParam.dictType)
          break
        case 'typeAndKey':
          // 按类型和键查询
          if (!this.queryParam.dictType || !this.queryParam.dictKey) {
            this.$message.warning('请输入字典类型和字典键')
            this.listLoading = false
            return
          }
          apiCall = dictionaryApi.findByTypeAndKey(this.queryParam.dictKey, this.queryParam.dictType)
          break
        case 'typeAndValue':
          // 按类型和值查询
          if (!this.queryParam.dictType || !this.queryParam.dictValue) {
            this.$message.warning('请输入字典类型和字典值')
            this.listLoading = false
            return
          }
          apiCall = dictionaryApi.findByTypeAndValue(this.queryParam.dictType, this.queryParam.dictValue)
          break
        default:
          this.$message.error('未知的查询方式')
          this.listLoading = false
          return
      }

      apiCall.then(res => {
        if (res.code === 1) {
          if (this.queryParam.searchType === 'page') {
            // 分页查询返回格式
            this.tableData = res.response.items || res.response.list || []
            this.counts = res.response.counts || res.response.total || 0
          } else {
            // 其他查询方式直接返回数组
            this.tableData = Array.isArray(res.response) ? res.response : [res.response]
            this.counts = this.tableData.length
          }
        } else {
          this.$message.error(res.message)
          this.tableData = []
          this.counts = 0
        }
        this.listLoading = false
      }).catch(() => {
        this.listLoading = false
        this.tableData = []
        this.counts = 0
      })
    },
    deleteDictionary (row) {
      this.$confirm('确认删除该字典吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        dictionaryApi.delete(row.id).then(res => {
          if (res.code === 1) {
            this.$message.success('删除成功')
            this.search()
          } else {
            this.$message.error(res.message)
          }
        })
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    }
  }
}
</script>

<style scoped>
.link-left {
  margin-left: 10px;
}
</style>
