<template>
  <div class="app-container">
    <el-form :model="queryParam" ref="queryForm" :inline="true">
      <el-form-item label="真实姓名：">
        <el-input v-model="queryParam.realName" placeholder="请输入真实姓名" clearable></el-input>
      </el-form-item>
      <el-form-item label="用户名：">
        <el-input v-model="queryParam.userName" placeholder="请输入用户名" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">查询</el-button>
        <router-link :to="{ path: '/user/teacher/edit', query: { mode: 'add' } }" class="link-left">
          <el-button type="primary">添加</el-button>
        </router-link>
        <el-button @click="resetQuery" class="link-left">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="listLoading" :data="tableData" border fit highlight-current-row style="width: 100%">
      <el-table-column label="序号" width="70" align="center">
        <template slot-scope="scope">
          {{ (queryParam.pageIndex - 1) * queryParam.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="realName" label="真实姓名">
        <template slot-scope="{row}">
          <span>{{ row.realName }}</span>
          <el-tooltip content="查看已授权试卷" placement="top">
            <i class="el-icon-document assigned-icon" @click="showAssignedDialog(row)"></i>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="sex" label="性别" width="60px;">
        <template slot-scope="{row}">
          {{ sexFormatter(row.sex) }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号">
        <template slot-scope="{row}">
          {{ row.phone || '13800000000' }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160px" />
      <el-table-column label="状态" prop="status" width="70px">
        <template slot-scope="{row}">
          <el-tag :type="statusTagFormatter(row.status)">
            {{ statusFormatter(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column width="330px" label="操作" align="center">
        <template slot-scope="{row}">
          <el-button size="mini" @click="changeStatus(row)" class="link-left">
            {{ statusBtnFormatter(row.status) }}
          </el-button>
          <router-link :to="{ path: '/user/teacher/edit', query: { id: row.id } }" class="link-left">
            <el-button size="mini">编辑</el-button>
          </router-link>
          <el-button size="mini" type="danger" @click="deleteUser(row)" class="link-left">删除</el-button>
          <el-button size="mini" type="success" @click="showGrantDialog(row)" class="link-left">授权</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParam.pageIndex" :limit.sync="queryParam.pageSize"
      @pagination="search" />

    <!-- Grant Paper Dialog -->
    <el-dialog title="试卷授权" :visible.sync="grantDialogVisible" width="60%">
      <el-form :inline="true" @submit.native.prevent="searchGrant" class="grant-search-form">
        <el-form-item label="学生名称：">
          <el-input
            v-model="grantQueryParam.studentName"
            clearable
            placeholder="请输入学生名称"
            @keyup.enter.native="searchGrant"
          ></el-input>
        </el-form-item>
        <el-form-item label="试卷名称：">
          <el-input
            v-model="grantQueryParam.examPaperName"
            clearable
            placeholder="请输入试卷名称"
            @keyup.enter.native="searchGrant"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchGrant">搜索</el-button>
          <el-button
            type="success"
            :loading="batchGrantLoading"
            :disabled="grantSelection.length === 0"
            @click="batchGrantPapers"
          >批量授权</el-button>
        </el-form-item>
      </el-form>
      <el-table
        ref="grantTable"
        :data="grantList"
        border
        fit
        highlight-current-row
        v-loading="paperLoading"
        @selection-change="handleGrantSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="序号" width="70" align="center">
          <template slot-scope="scope">
            {{ (grantQueryParam.pageNo - 1) * grantQueryParam.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="realName" label="学生名称" />
        <el-table-column prop="examPaperName" label="试卷名称" />
        <el-table-column prop="startTime" label="开始时间" width="160px" />
        <el-table-column prop="endTime" label="结束时间" width="160px" />
        <el-table-column label="操作" width="120px" align="center">
          <template slot-scope="{row}">
            <el-button size="mini" type="primary" @click="grantPaper(row)" :loading="row.loading">授权</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="grantTotal > 0"
        :total="grantTotal"
        :page.sync="grantQueryParam.pageNo"
        :limit.sync="grantQueryParam.pageSize"
        layout="total, prev, pager, next, jumper"
        @pagination="loadGrantPage"
      />
      <span slot="footer" class="dialog-footer">
        <el-button @click="grantDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 已授权试卷 Dialog -->
    <el-dialog :title="assignedDialogTitle" :visible.sync="assignedDialogVisible" width="60%">
      <el-form :inline="true" @submit.native.prevent="searchAssigned" class="grant-search-form">
        <el-form-item label="学生名称：">
          <el-input
            v-model="assignedQueryParam.studentName"
            clearable
            placeholder="请输入学生名称"
            @keyup.enter.native="searchAssigned"
          ></el-input>
        </el-form-item>
        <el-form-item label="试卷名称：">
          <el-input
            v-model="assignedQueryParam.examPaperName"
            clearable
            placeholder="请输入试卷名称"
            @keyup.enter.native="searchAssigned"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchAssigned">搜索</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="assignedList" border fit highlight-current-row v-loading="assignedLoading">
        <el-table-column label="序号" width="70" align="center">
          <template slot-scope="scope">
            {{ (assignedQueryParam.pageNo - 1) * assignedQueryParam.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="studentName" label="学生名称" />
        <el-table-column prop="examPaperName" label="试卷名称" />
        <el-table-column prop="startTime" label="开始时间" width="180px" />
        <el-table-column prop="endTime" label="结束时间" width="180px" />
      </el-table>
      <pagination
        v-show="assignedTotal > 0"
        :total="assignedTotal"
        :page.sync="assignedQueryParam.pageNo"
        :limit.sync="assignedQueryParam.pageSize"
        layout="total, prev, pager, next, jumper"
        @pagination="loadAssignedPage"
      />
      <span slot="footer" class="dialog-footer">
        <el-button @click="assignedDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import Pagination from '@/components/Pagination'
import userApi from '@/api/user'
import examPaperApi from '@/api/examPaper'

export default {
  components: { Pagination },
  data () {
    return {
      queryParam: {
        realName: '',
        userName: '',
        identity: '',
        email: '',
        role: 2, // Teacher role
        pageIndex: 1,
        pageSize: 10
      },
      listLoading: true,
      tableData: [],
      total: 0,
      grantDialogVisible: false,
      grantList: [],
      grantTotal: 0,
      grantQueryParam: {
        pageNo: 1,
        pageSize: 10,
        studentName: '',
        examPaperName: ''
      },
      currentTeacherId: null,
      paperLoading: false,
      grantSelection: [],
      batchGrantLoading: false,
      assignedDialogVisible: false,
      assignedDialogTitle: '已授权试卷',
      assignedList: [],
      assignedTotal: 0,
      assignedQueryParam: {
        pageNo: 1,
        pageSize: 10,
        studentName: '',
        examPaperName: ''
      },
      assignedLoading: false,
      assignedTeacherId: null
    }
  },
  created () {
    this.search()
  },
  methods: {
    search () {
      this.listLoading = true
      // 过滤空值参数
      const params = {
        ...this.queryParam,
        realName: this.queryParam.realName || undefined,
        userName: this.queryParam.userName || undefined,
        identity: this.queryParam.identity || undefined,
        email: this.queryParam.email || undefined
      }

      userApi.getUserPageList(params).then(data => {
        const re = data.response
        this.tableData = re.list.map(item => ({
          ...item,
          identity: item.identity || null,
          email: item.email || null
        }))
        this.total = re.total
        this.queryParam.pageIndex = re.pageNum
        this.listLoading = false
      }).catch(() => {
        this.listLoading = false
      })
    },
    changeStatus (row) {
      let _this = this
      userApi.changeStatus(row.id).then(re => {
        if (re.code === 1) {
          row.status = re.response
          _this.$message.success(re.message)
        } else {
          _this.$message.error(re.message)
        }
      })
    },
    deleteUser (row) {
      let _this = this
      userApi.deleteUser(row.id).then(re => {
        if (re.code === 1) {
          _this.search()
          _this.$message.success(re.message)
        } else {
          _this.$message.error(re.message)
        }
      })
    },
    submitForm () {
      this.queryParam.pageIndex = 1
      this.search()
    },
    resetQuery () {
      this.queryParam = {
        realName: '',
        userName: '',
        identity: '',
        email: '',
        role: 2, // Teacher role
        pageIndex: 1,
        pageSize: 10
      }
      this.search()
    },
    showGrantDialog (row) {
      this.currentTeacherId = row.id
      this.grantQueryParam.pageNo = 1
      this.grantQueryParam.studentName = ''
      this.grantQueryParam.examPaperName = ''
      this.grantSelection = []
      this.grantDialogVisible = true
      this.loadGrantPage()
    },
    showAssignedDialog (row) {
      this.assignedTeacherId = row.id
      this.assignedDialogTitle = `${row.realName || row.userName} - 已授权试卷`
      this.assignedQueryParam.pageNo = 1
      this.assignedQueryParam.studentName = ''
      this.assignedQueryParam.examPaperName = ''
      this.assignedDialogVisible = true
      this.loadAssignedPage()
    },
    searchAssigned () {
      this.assignedQueryParam.pageNo = 1
      this.loadAssignedPage()
    },
    loadAssignedPage () {
      this.assignedLoading = true
      const params = {}
      const studentName = (this.assignedQueryParam.studentName || '').trim()
      const examPaperName = (this.assignedQueryParam.examPaperName || '').trim()
      if (studentName) {
        params.studentName = studentName
      }
      if (examPaperName) {
        params.examPaperName = examPaperName
      }
      examPaperApi.teacherAssignedPage(
        this.assignedTeacherId,
        this.assignedQueryParam.pageNo,
        this.assignedQueryParam.pageSize,
        params
      ).then(response => {
        if (response.code === 1) {
          const re = response.response
          this.assignedList = re.items || []
          this.assignedTotal = re.counts || 0
          this.assignedQueryParam.pageNo = re.pageNo || this.assignedQueryParam.pageNo
        } else {
          this.$message.error(response.message || '获取已授权试卷失败')
        }
        this.assignedLoading = false
      }).catch(error => {
        this.assignedLoading = false
        this.$message.error('获取已授权试卷失败')
        console.error(error)
      })
    },
    handleGrantSelectionChange (selection) {
      this.grantSelection = selection
    },
    clearGrantSelection () {
      this.grantSelection = []
      this.$nextTick(() => {
        if (this.$refs.grantTable) {
          this.$refs.grantTable.clearSelection()
        }
      })
    },
    searchGrant () {
      this.grantQueryParam.pageNo = 1
      this.loadGrantPage()
    },
    loadGrantPage () {
      this.paperLoading = true
      const params = {}
      const studentName = (this.grantQueryParam.studentName || '').trim()
      const examPaperName = (this.grantQueryParam.examPaperName || '').trim()
      if (studentName) {
        params.studentName = studentName
      }
      if (examPaperName) {
        params.examPaperName = examPaperName
      }
      examPaperApi.teacherGrantPage(
        this.currentTeacherId,
        this.grantQueryParam.pageNo,
        this.grantQueryParam.pageSize,
        params
      ).then(response => {
        if (response.code === 1) {
          const re = response.response
          this.grantList = re.items || []
          this.grantTotal = re.counts || 0
          this.grantQueryParam.pageNo = re.pageNo || this.grantQueryParam.pageNo
          this.clearGrantSelection()
        } else {
          this.$message.error(response.message || '获取授权列表失败')
        }
        this.paperLoading = false
      }).catch(error => {
        this.paperLoading = false
        this.$message.error('获取授权列表失败')
        console.error(error)
      })
    },
    async batchGrantPapers () {
      if (this.grantSelection.length === 0) {
        this.$message.warning('请至少选择一条记录')
        return
      }
      try {
        this.batchGrantLoading = true
        const examAssignmentIds = this.grantSelection.map(row => row.id)
        const response = await examPaperApi.batchGrantTeacherAssignment(this.currentTeacherId, examAssignmentIds)
        if (response.code === 1) {
          const successCount = response.response || 0
          if (successCount > 0) {
            this.$message.success(`成功授权 ${successCount} 条`)
            this.loadGrantPage()
          } else {
            this.$message.warning('没有可授权的记录')
          }
        } else {
          this.$message.error(response.message || '批量授权失败')
        }
      } catch (error) {
        this.$message.error('批量授权失败')
        console.error(error)
      } finally {
        this.batchGrantLoading = false
      }
    },
    async grantPaper (row) {
      try {
        this.$set(row, 'loading', true)
        const response = await examPaperApi.insertTeacherAssignment(row.id, this.currentTeacherId)
        if (response.code === 1) {
          this.$message.success('授权成功')
          this.loadGrantPage()
        } else {
          this.$message.error(response.message || '授权失败')
        }
      } catch (error) {
        this.$message.error('授权失败')
        console.error(error)
      } finally {
        this.$set(row, 'loading', false)
      }
    },

    sexFormatter (sexValue) {
      const sexItem = this.sexEnum.find(item => item.key === sexValue)
      return sexItem ? sexItem.value : '未知'
    },
    statusFormatter (status) {
      return this.enumFormat(this.statusEnum, status)
    },
    statusTagFormatter (status) {
      return this.enumFormat(this.statusTag, status)
    },
    statusBtnFormatter (status) {
      return this.enumFormat(this.statusBtn, status)
    }
  },
  computed: {
    ...mapGetters('enumItem', [
      'enumFormat'
    ]),
    ...mapState('enumItem', {
      sexEnum: state => state.user.sexEnum,
      statusEnum: state => state.user.statusEnum,
      statusTag: state => state.user.statusTag,
      statusBtn: state => state.user.statusBtn
    })
  }
}
</script>

<style scoped>
.link-left {
  margin-left: 10px;
}

.grant-search-form {
  margin-bottom: 12px;
}

.dialog-footer {
  padding: 10px 20px;
  text-align: right;
}

.assigned-icon {
  margin-left: 6px;
  color: #409EFF;
  cursor: pointer;
  font-size: 16px;
  vertical-align: middle;
}

.assigned-icon:hover {
  color: #66b1ff;
}
</style>
