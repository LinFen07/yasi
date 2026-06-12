<template>
  <div class="app-container">
    <el-form :model="queryParam" ref="queryForm" :inline="true">
      <el-form-item label="真实姓名：">
        <el-input v-model="queryParam.realName" placeholder="请输入真实姓名" clearable></el-input>
      </el-form-item>
      <el-form-item label="用户名：">
        <el-input v-model="queryParam.userName" placeholder="请输入用户名" clearable></el-input>
      </el-form-item>
      <el-form-item label="身份证号：">
        <el-input v-model="queryParam.identity" placeholder="请输入身份证号" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="listLoading" :data="tableData" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="realName" label="真实姓名" />
      <el-table-column prop="identity" label="身份证号">
        <template slot-scope="{row}">
          {{ row.identity || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱">
        <template slot-scope="{row}">
          {{ row.email || 123456 }}
        </template>
      </el-table-column>
      <el-table-column prop="address" label="地址">
        <template slot-scope="{row}">
          {{ row.address || '广州' }}
        </template>
      </el-table-column>
      <el-table-column prop="sex" label="性别" width="60px;" :formatter="sexFormatter" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="createTime" label="创建时间" width="160px" />
      <el-table-column label="状态" prop="status" width="70px">
        <template slot-scope="{row}">
          <el-tag :type="statusTagFormatter(row.status)">
            {{ statusFormatter(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column width="290px" label="操作" align="center">
        <template slot-scope="{row}">
          <el-button size="mini" @click="changeStatus(row)" class="link-left">
            {{ statusBtnFormatter(row.status) }}
          </el-button>
          <router-link :to="{ path: '/user/student/edit', query: { id: row.id } }" class="link-left">
            <el-button size="mini">编辑</el-button>
          </router-link>
          <el-button size="mini" type="success" @click="showExamAssignDialog(row)" class="link-left">授权</el-button>
          <el-button size="mini" type="danger" @click="deleteUser(row)" class="link-left">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParam.pageIndex" :limit.sync="queryParam.pageSize"
      @pagination="search" />
    <el-dialog title="试卷授权" :visible.sync="examAssignDialogVisible" width="60%">
      <el-table :data="examPaperList" border style="width: 100%">
        <el-table-column prop="name" label="试卷名称"></el-table-column>
        <el-table-column label="考试时间" width="450">
          <template slot-scope="{row}">
            <el-date-picker v-model="row.examTimeRange" type="datetimerange" range-separator="至"
              start-placeholder="开始时间" end-placeholder="结束时间" value-format="yyyy-MM-dd HH:mm:ss"
              :default-time="['09:00:00', '18:00:00']">
            </el-date-picker>
          </template>
        </el-table-column>
        <el-table-column label="试卷授权" width="120">
          <template slot-scope="{row}">
            <el-button size="mini" type="primary" @click="assignExamToStudent(row)" :disabled="isExamAssigned(row.id)"
              v-if="!isExamAssigned(row.id)">
              授权
            </el-button>
            <el-button size="mini" type="danger" @click="cancelAssignment(row)" v-if="isExamAssigned(row.id)">
              取消授权
            </el-button>
          </template>
        </el-table-column>
        <!-- 套餐授权列 -->
        <el-table-column label="套餐授权" width="250">
          <template slot-scope="{row}">
            <el-select v-model="row.selectedPackages" multiple placeholder="请选择套餐" size="mini"
              @change="handlePackageChange(row)" style="width: 100%">
              <el-option v-for="pkg in packageOptions" :key="pkg.value" :label="pkg.label" :value="pkg.value" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="examPaperTotal > 0" :total="examPaperTotal" :page.sync="examPaperQuery.pageNow"
        :limit.sync="examPaperQuery.pageSize" @pagination="loadExamPaperList" />
      <span slot="footer" class="dialog-footer">
        <el-button @click="examAssignDialogVisible = false">关闭</el-button>
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
        address: '',
        role: 1,
        pageIndex: 1,
        pageSize: 10
      },
      listLoading: true,
      tableData: [],
      total: 0,
      examAssignDialogVisible: false, // 授权对话框显示状态
      currentStudent: null, // 当前操作的学生
      examPaperList: [], // 试卷列表
      assignedExams: [], // 已授权的试卷列表
      examPaperQuery: {
        pageNow: 1,
        pageSize: 10
      },
      examPaperTotal: 0,
      assignedPackages: [],
      allExamPapers: [], // 存储所有试卷ID和名称
      packageOptions: []
    }
  },
  created () {
    this.search()
    this.loadAllExamPapers() // 加载所有试卷
    this.loadPackageTypes()
  },
  methods: {
    loadAllExamPapers () {
      examPaperApi.allPaper().then(response => {
        if (response.code === 1) {
          this.allExamPapers = response.response
        } else {
          this.$message.error('获取试卷列表失败')
        }
      }).catch(error => {
        console.error('获取试卷列表失败:', error)
        this.$message.error('获取试卷列表失败')
      })
    },
    search () {
      this.listLoading = true
      // 构建查询参数，过滤掉空值
      const params = {
        ...this.queryParam,
        realName: this.queryParam.realName || undefined,
        userName: this.queryParam.userName || undefined,
        identity: this.queryParam.identity || undefined,
        email: this.queryParam.email || undefined,
        address: this.queryParam.address || undefined
      }

      userApi.getUserPageList(params).then(data => {
        const re = data.response
        this.tableData = re.list.map(item => ({
          ...item,
          identity: item.identity || null,
          email: item.email || null,
          address: item.address || null
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
        address: '',
        role: 1,
        pageIndex: 1,
        pageSize: 10
      }
      this.search()
    },
    sexFormatter (row, column, cellValue, index) {
      return this.enumFormat(this.sexEnum, cellValue)
    },
    statusFormatter (status) {
      return this.enumFormat(this.statusEnum, status)
    },
    statusTagFormatter (status) {
      return this.enumFormat(this.statusTag, status)
    },
    statusBtnFormatter (status) {
      return this.enumFormat(this.statusBtn, status)
    },
    // 显示试卷授权对话框
    showExamAssignDialog (row) {
      this.currentStudent = row
      this.examAssignDialogVisible = true
      this.loadExamPaperList()
      this.loadAssignedExams()
    },

    // 加载试卷列表
    loadExamPaperList () {
      const start = (this.examPaperQuery.pageNow - 1) * this.examPaperQuery.pageSize
      const end = start + this.examPaperQuery.pageSize
      this.examPaperList = this.allExamPapers.slice(start, end).map(item => ({
        ...item,
        selectedPackages: this.getAssignedPackagesForPaper(item.id) || [],
        examTimeRange: this.getDefaultExamTimeRange(item.id)
      }))
      this.examPaperTotal = this.allExamPapers.length
    },
    getDefaultExamTimeRange (paperId) {
      // 如果有已授权的记录，使用已设置的时间
      const assignment = this.assignedExams.find(item =>
        item.examPaperId === paperId && item.userId === this.currentStudent.id
      )
      if (assignment) {
        return [assignment.startTime, assignment.endTime]
      }

      // 否则设置默认时间为当前时间+1小时开始，持续2小时
      const now = new Date()
      const startTime = new Date(now.getTime() + 60 * 60 * 1000) // 1小时后
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // 开始后2小时

      return [
        this.formatDateTime(startTime),
        this.formatDateTime(endTime)
      ]
    },
    formatDateTime (date) {
      const pad = num => num.toString().padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    },
    getAssignedPackagesForPaper (paperId) {
      const assigned = this.assignedPackages.find(item => item.paperId === paperId)
      return assigned ? assigned.packages : []
    },
    loadPackageTypes () {
      examPaperApi.findByType('package_type').then(response => {
        if (response.code === 1 && response.response) {
          console.log('套餐类型数据:', response.response)
          this.packageOptions = response.response.map(item => ({
            value: item.dictKey, // 使用dictKey作为value
            label: item.dictValue // 使用dictValue作为显示文本
          }))
        } else {
          this.$message.error('获取套餐类型失败')
          // 设置默认空数组，避免后续操作出错
          this.packageOptions = []
        }
      }).catch(error => {
        console.error('获取套餐类型失败:', error)
        this.$message.error('获取套餐类型失败')
        this.packageOptions = []
      })
    },
    // 处理套餐选择变化
    handlePackageChange (row) {
      this.$confirm('确定要修改套餐授权吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.savePackageAssignment(row.id, row.selectedPackages)
      }).catch(() => {
        this.loadExamPaperList()
        this.$message.info('已取消修改')
      })
    },

    // 保存套餐授权
    savePackageAssignment (paperId, packages) {
      setTimeout(() => {
        const index = this.assignedPackages.findIndex(item => item.paperId === paperId)
        if (index >= 0) {
          this.assignedPackages[index].packages = [...packages]
        } else {
          this.assignedPackages.push({
            paperId,
            packages: [...packages]
          })
        }
        this.$message.success('套餐授权修改成功')
      }, 500)
    },

    // 加载已授权的试卷
    loadAssignedExams () {
      if (!this.currentStudent) return Promise.resolve()

      return examPaperApi.findList(
        // 0, // examPaperId
        1, // pageNow
        1000 // pageSize
        // 0, // reservationId
        // this.currentStudent.id // userId
      ).then(response => {
        if (response.code === 1) {
          this.assignedExams = response.response.items || []
        } else {
          this.$message.error(response.message || '获取已授权试卷失败')
        }
        return response
      }).catch(error => {
        console.error('获取授权列表失败:', error)
        let errorMsg = error.response?.data?.message || error.message || '获取授权列表失败'
        this.$message.error(errorMsg)
        throw error
      })
    },
    // 检查试卷是否已授权
    isExamAssigned (examPaperId) {
      return this.assignedExams.some(item =>
        item.examPaperId === examPaperId && item.userId === this.currentStudent.id
      )
    },

    // 授权试卷给学生
    assignExamToStudent (examPaper) {
      // 检查是否设置了考试时间
      if (!examPaper.examTimeRange || examPaper.examTimeRange.length !== 2) {
        this.$message.error('请先设置考试开始和结束时间')
        return
      }

      const [startTime, endTime] = examPaper.examTimeRange

      // 查找该试卷是否已有授权记录
      const existingAssignment = this.assignedExams.find(item =>
        item.examPaperId === examPaper.id && item.userId === this.currentStudent.id
      )

      const params = {
        examPaperId: examPaper.id,
        userId: this.currentStudent.id,
        reservationId: existingAssignment ? existingAssignment.reservationId : 0,
        startTime: startTime,
        endTime: endTime
      }

      this.$confirm(`确定要授权这份试卷给学生吗? 考试时间: ${startTime} 至 ${endTime}`, '确认授权', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        examPaperApi.save(params)
          .then(response => {
            if (response.code === 1) {
              this.$message.success('授权成功')
              this.loadAssignedExams() // 刷新已授权列表
            } else {
              this.$message.error(response.message || '授权失败')
            }
          })
          .catch(error => {
            console.error('授权失败:', error)
            this.$message.error(error.response?.data?.message || '授权失败')
          })
      }).catch(() => {
        this.$message.info('已取消授权')
      })
    },

    // 取消授权
    cancelAssignment (examPaper) {
      this.$confirm('确定要取消该试卷的授权吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 首先找到已授权记录ID
        const assignment = this.assignedExams.find(item =>
          item.examPaperId === examPaper.id && item.userId === this.currentStudent.id
        )

        if (!assignment) {
          this.$message.error('未找到授权记录')
          return
        }

        examPaperApi.delete(assignment.id)
          .then(response => {
            if (response.code === 1) {
              this.$message.success('取消授权成功')
              // 从assignedExams中移除该记录
              this.assignedExams = this.assignedExams.filter(item =>
                !(item.examPaperId === examPaper.id && item.userId === this.currentStudent.id)
              )
              // 更新examPaperList中该试卷的授权状态
              const index = this.examPaperList.findIndex(item => item.id === examPaper.id)
              if (index !== -1) {
                // Vue.set响应式更新
                this.$set(this.examPaperList, index, {
                  ...this.examPaperList[index],
                  selectedPackages: this.getAssignedPackagesForPaper(examPaper.id)
                })
              }
            } else {
              this.$message.error(response.message || '取消授权失败')
            }
          })
          .catch(error => {
            console.error('取消授权失败:', error)
            this.$message.error(error.response?.data?.message || '取消授权失败')
          })
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    isPackageAssigned (examPaperId) {
      return this.assignedPackages.includes(examPaperId)
    },

    togglePackageAssignment (row) {
      if (this.isPackageAssigned(row.id)) {
        this.cancelPackageAssignment(row)
      } else {
        this.assignPackageToStudent(row)
      }
    },

    assignPackageToStudent (examPaper) {
      setTimeout(() => {
        this.$message.success('套餐授权成功')
        this.assignedPackages.push(examPaper.id)
      }, 500)
    },

    cancelPackageAssignment (examPaper) {
      this.$confirm('确定要取消该套餐的授权吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        setTimeout(() => {
          this.$message.success('取消套餐授权成功')
          this.assignedPackages = this.assignedPackages.filter(id => id !== examPaper.id)
        }, 500)
      }).catch(() => {
        this.$message.info('已取消操作')
      })
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

<style lang="scss" scoped>
.link-left {
  margin-left: 10px;
}

.el-dialog__body {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
