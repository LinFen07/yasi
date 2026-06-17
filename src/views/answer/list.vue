<template>
  <div class="app-container">
    <el-form :model="queryParam" ref="queryForm" :inline="true">
      <el-form-item label="用户名称：">
        <el-input v-model="queryParam.userName" clearable placeholder="请输入用户名称"></el-input>
      </el-form-item>
      <el-form-item label="试卷名称：">
        <el-input v-model="queryParam.paperName" clearable placeholder="请输入试卷名称"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="listLoading" :data="tableData" border fit highlight-current-row style="width: 100%">
      <el-table-column label="序号" width="70" align="center">
        <template slot-scope="scope">
          {{ (queryParam.pageIndex - 1) * queryParam.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="paperName" label="试卷名称"/>
      <el-table-column prop="userName" label="用户名称"/>
      <el-table-column  label="得分" width="100px" >
        <template slot-scope="{row}">
          {{row.userScore}} / {{row.paperScore}}
        </template>
      </el-table-column>
      <el-table-column  label="题目对错" width="80px" >
        <template slot-scope="{row}">
          {{row.questionCorrect}} / {{row.questionCount}}
        </template>
      </el-table-column>
      <el-table-column prop="doTime" label="耗时" width="100px"/>
      <el-table-column prop="createTime" label="提交时间" width="160px"/>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="queryParam.pageIndex" :limit.sync="queryParam.pageSize"
                @pagination="search"/>
  </div>
</template>

<script>

import Pagination from '@/components/Pagination'
import examPaperAnswerApi from '@/api/examPaperAnwser'

export default {
  components: { Pagination },
  data () {
    return {
      queryParam: {
        userName: '',
        paperName: '',
        pageIndex: 1,
        pageSize: 10
      },
      listLoading: false,
      tableData: [],
      total: 0
    }
  },
  created () {
    this.search()
  },
  methods: {
    search () {
      this.listLoading = true
      const params = {
        ...this.queryParam,
        userName: this.queryParam.userName || undefined,
        paperName: this.queryParam.paperName || undefined
      }
      examPaperAnswerApi.page(params).then(data => {
        const re = data.response
        this.tableData = re.list
        this.total = re.total
        this.queryParam.pageIndex = re.pageNum
        this.listLoading = false
      })
    },
    submitForm () {
      this.queryParam.pageIndex = 1
      this.search()
    }
  }
}
</script>
