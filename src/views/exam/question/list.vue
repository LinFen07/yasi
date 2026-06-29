<template>
  <div class="app-container">
    <div class="filter-bar">
      <div class="filter-bar__row">
        <el-form :model="queryParam" ref="queryForm" :inline="true" class="filter-bar__form">
          <el-form-item label="题干：">
            <el-input v-model="queryParam.content" clearable placeholder="请输入题干关键词"></el-input>
          </el-form-item>
          <el-form-item label="题型：">
            <el-select v-model="queryParam.questionType" clearable>
              <el-option v-for="item in questionType" :key="item.key" :value="item.key" :label="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="试卷名称：">
            <el-input v-model="queryParam.paperName" clearable placeholder="请输入试卷名称"></el-input>
          </el-form-item>
          <el-form-item label="所属模块：">
            <el-select v-model="queryParam.moduleType" clearable placeholder="全部">
              <el-option v-for="item in moduleTypeEnum" :key="item.key" :value="item.key" :label="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item class="filter-bar__search-item">
            <el-button type="primary" @click="submitForm">查询</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="filter-bar__add-row">
        <el-popover
          ref="addQuestionPopover"
          placement="bottom-start"
          trigger="click"
          popper-class="question-type-popover"
        >
          <div class="question-type-menu">
            <div
              v-for="item in editUrlEnum"
              :key="item.key"
              class="question-type-menu__item"
              @click="goAddQuestion(item)"
            >
              {{ item.name }}
            </div>
          </div>
          <el-button slot="reference" type="primary">添加题目</el-button>
        </el-popover>
      </div>
    </div>
    <el-table v-loading="listLoading" :data="tableData" border fit highlight-current-row class="question-list-table" style="width: 100%">
      <el-table-column label="序号" width="70" align="center" header-align="center">
        <template slot-scope="scope">
          {{ (queryParam.pageIndex - 1) * queryParam.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="paperName" label="试卷名称" show-overflow-tooltip width="140px" align="center" header-align="center" />
      <el-table-column prop="moduleType" label="所属模块" :formatter="moduleTypeFormatter" width="80px" align="center" header-align="center" />
      <el-table-column prop="partNo" label="Part" width="70px" align="center" header-align="center" :formatter="partNoFormatter" />
      <el-table-column prop="questionType" label="题型" :formatter="questionTypeFormatter" width="70px" align="center" header-align="center" />
      <el-table-column prop="shortTitle" label="题干" show-overflow-tooltip align="center" header-align="center" />
      <el-table-column prop="score" label="分数" width="60px" align="center" header-align="center" />
      <el-table-column prop="difficult" label="难度" width="60px" align="center" header-align="center" />
      <el-table-column prop="createTime" label="创建时间" width="160px" align="center" header-align="center" />
      <el-table-column label="操作" align="center" header-align="center" width="220px">
        <template slot-scope="{row}">
          <el-button size="mini" @click="showQuestion(row)">预览</el-button>
          <el-button size="mini" @click="editQuestion(row)">编辑</el-button>
          <el-button size="mini" type="danger" @click="deleteQuestion(row)" class="link-left">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParam.pageIndex" :limit.sync="queryParam.pageSize"
      @pagination="search" />
    <QuestionPreviewDialog
      :visible.sync="questionShow.dialog"
      :q-type="questionShow.qType"
      :question="questionShow.question"
      :q-loading="questionShow.loading"
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import Pagination from '@/components/Pagination'
import QuestionPreviewDialog from './components/QuestionPreviewDialog'
import questionApi from '@/api/question'

export default {
  components: { Pagination, QuestionPreviewDialog },
  data () {
    return {
      queryParam: {
        content: '',
        questionType: null,
        paperName: '',
        moduleType: null,
        pageIndex: 1,
        pageSize: 10
      },
      listLoading: true,
      tableData: [],
      total: 0,
      questionShow: {
        qType: 0,
        dialog: false,
        question: null,
        loading: false
      }
    }
  },
  created () {
    this.search()
  },
  methods: {
    submitForm () {
      this.queryParam.pageIndex = 1
      this.search()
    },
    search () {
      this.listLoading = true
      questionApi.pageList(this.queryParam).then(data => {
        const re = data.response
        this.tableData = re.list
        this.total = re.total
        this.queryParam.pageIndex = re.pageNum
        this.listLoading = false
      })
    },
    addQuestion () {
      this.$router.push('/exam/question/edit/singleChoice')
    },
    goAddQuestion (item) {
      if (this.$refs.addQuestionPopover) {
        this.$refs.addQuestionPopover.doClose()
      }
      this.$router.push({ path: item.value })
    },
    // showQuestion (row) {
    //   let _this = this
    //   this.questionShow.dialog = true
    //   this.questionShow.loading = true
    //   questionApi.select(row.id).then(re => {
    //     _this.questionShow.qType = re.response.questionType
    //     _this.questionShow.question = re.response
    //     _this.questionShow.loading = false
    //   })
    // },
    showQuestion (row) {
      this.questionShow.dialog = true
      this.questionShow.loading = true
      questionApi.select(row.id).then(re => {
        if (re.code === 1) {
          this.questionShow.qType = re.response.questionType
          this.questionShow.question = re.response
        } else {
          this.$message.error(re.message || '获取题目详情失败')
        }
      }).catch(error => {
        console.error('获取题目详情错误:', error)
        this.$message.error('获取题目详情失败')
      }).finally(() => {
        this.questionShow.loading = false
      })
    },
    editQuestion (row) {
      let url = this.enumFormat(this.editUrlEnum, row.questionType)
      this.$router.push({ path: url, query: { id: row.id } })
    },
    // editQuestion (row) {
    //   try {
    //     let url = this.enumFormat(this.editUrlEnum, row.questionType)
    //     if (!url) {
    //       throw new Error('未找到对应的编辑路径')
    //     }
    //     this.$router.push({ path: url, query: { id: row.id } })
    //   } catch (error) {
    //     console.error('编辑题目错误:', error)
    //     this.$message.error('编辑题目失败: ' + error.message)
    //   }
    // },
    deleteQuestion (row) {
      let _this = this
      questionApi.deleteQuestion(row.id).then(re => {
        if (re.code === 1) {
          _this.search()
          _this.$message.success(re.message)
        } else {
          _this.$message.error(re.message)
        }
      })
    },
    questionTypeFormatter (row, column, cellValue, index) {
      return this.enumFormat(this.questionType, cellValue)
    },
    moduleTypeFormatter (row, column, cellValue, index) {
      return this.enumFormat(this.moduleTypeEnum, cellValue)
    },
    partNoFormatter (row, column, cellValue) {
      return cellValue != null && cellValue !== '' ? cellValue : '-'
    }
  },
  computed: {
    ...mapGetters('enumItem', ['enumFormat']),
    ...mapState('enumItem', {
      // questionType: state => state.exam.question.typeEnum,
      questionType: state => state.exam.question.typeEnum,
      editUrlEnum: state => state.exam.question.editUrlEnum,
      moduleTypeEnum: state => state.exam.examPaper.moduleTypeEnum
    })
  }
}
</script>

<style scoped>
.filter-bar {
  margin-bottom: 20px;
}

.filter-bar__row {
  display: flex;
  align-items: flex-start;
}

.filter-bar__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
}

.filter-bar__form >>> .el-form-item {
  margin-bottom: 18px;
}

.filter-bar__search-item {
  margin-left: auto;
  margin-right: 52px;
}

.filter-bar__search-item >>> .el-form-item__content {
  line-height: 36px;
}

.filter-bar__search-item >>> .el-button {
  height: 36px;
  padding: 0 20px;
  line-height: 34px;
}

.filter-bar__add-row {
  margin-top: 10px;
}

.question-list-table >>> th,
.question-list-table >>> td {
  text-align: center !important;
}

.question-list-table >>> .cell {
  text-align: center;
  justify-content: center;
}
</style>

<style>
.question-type-popover {
  padding: 12px;
}

.question-type-menu {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  min-width: 240px;
}

.question-type-menu__item {
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  font-size: 14px;
  color: #606266;
  background: #fff;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.question-type-menu__item:hover {
  color: #1890ff;
  border-color: #b3d8ff;
  background: #ecf5ff;
}
</style>
