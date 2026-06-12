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
        <router-link :to="{ path: '/user/teacher/edit' }" class="link-left">
          <el-button type="primary">添加</el-button>
        </router-link>
        <el-button @click="resetQuery" class="link-left">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="listLoading" :data="tableData" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="realName" label="真实姓名" />
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
    <el-dialog title="试卷授权" :visible.sync="grantDialogVisible" width="50%">
      <el-table :data="grantedPapers" :key="grantTableKey" border fit highlight-current-row v-loading="paperLoading">
        <el-table-column prop="realName" label="学生名称" />
        <el-table-column prop="examPaperName" label="试卷名称" />
        <el-table-column prop="startTime" label="开始时间" />
        <el-table-column prop="endTime" label="结束时间" />
        <el-table-column label="操作" width="180px" align="center">
          <template slot-scope="{row}">
            <el-button size="mini" :type="row.isAssigned ? 'danger' : 'primary'" @click="toggleAssignment(row)"
              :loading="row.loading">
              {{ row.isAssigned ? '取消授权' : '授权' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="grantDialogVisible = false">关闭</el-button>
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
      grantTableKey: 0,
      grantDialogVisible: false,
      grantedPapers: [], // 已授权的试卷ID列表
      currentTeacherId: null,
      paperLoading: false,
      allPapers: [] // 存储所有试卷的id和name
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
      console.log('Opening dialog for teacher:', row.id)
      this.currentTeacherId = row.id
      this.grantDialogVisible = true
      this.paperLoading = true

      Promise.all([
        this.loadAllPapers(),
        this.loadGrantedPapers()
      ]).then(() => {
        // 检查返回的userId是否与当前教师一致
        const inconsistent = this.grantedPapers.some(item => item.userId !== this.currentTeacherId)
        if (inconsistent) {
          console.warn('发现不一致的userId记录')
        }
      }).finally(() => {
        console.log('Granted papers:', this.grantedPapers)
        this.paperLoading = false
      })
    },
    loadAllPapers () {
      return examPaperApi.allPaper().then(response => {
        if (response.code === 1) {
          this.allPapers = response.response || []
        } else {
          this.$message.error(response.message || '获取试卷列表失败')
        }
      }).catch(error => {
        console.error('获取数据失败:', error)
        this.$message.error('获取数据失败')
      })
    },
    async toggleAssignment (row) {
      try {
        this.$set(row, 'loading', true)

        if (row.isAssigned) {
          // 取消授权 - 使用row.id作为examPaperId
          await examPaperApi.deleteByUserIdAndExamPaperId(row.id, this.currentTeacherId)
          this.$message.success('取消授权成功')
        } else {
          // 授权 - 使用row.id作为examPaperId
          await examPaperApi.insertTeacherAssignment(row.id, this.currentTeacherId)
          this.$message.success('授权成功')
        }

        // 切换状态
        row.isAssigned = !row.isAssigned
        this.grantTableKey += 1 // 强制刷新表格
      } catch (error) {
        this.$message.error('操作失败')
        console.error('操作失败:', error)
      } finally {
        this.$set(row, 'loading', false)
      }
    },

    async loadGrantedPapers () {
      try {
        this.paperLoading = true
        const response = await examPaperApi.findList(1, 1000)

        if (response.code === 1) {
          // 获取已授权的试卷列表
          const grantedList = response.response.items || []

          // 检查每份试卷是否已授权给当前教师
          const checkAssignPromises = grantedList.map(async paper => {
            // 使用paper.id作为examPaperId参数
            const assignResponse = await examPaperApi.isAssign(paper.id, this.currentTeacherId)
            return {
              ...paper,
              isAssigned: assignResponse.code === 1 && assignResponse.response
            }
          })

          this.grantedPapers = await Promise.all(checkAssignPromises)
        } else {
          this.$message.error(response.message || '获取授权列表失败')
        }
      } catch (error) {
        console.error('获取授权数据失败:', error)
        this.$message.error('获取授权数据失败')
      } finally {
        this.paperLoading = false
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

.dialog-footer {
  padding: 10px 20px;
  text-align: right;
}
</style>
