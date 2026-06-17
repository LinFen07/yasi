<template>
  <div class="app-container">
    <el-form :model="queryParam" ref="queryForm" :inline="true">
      <el-form-item label="名称：">
        <el-input v-model="queryParam.name" clearable placeholder="请输入试卷名称"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">查询</el-button>
        <router-link :to="{path:'/exam/paper/edit'}" class="link-left">
          <el-button type="primary">添加</el-button>
        </router-link>
      </el-form-item>
    </el-form>
    <el-table v-loading="listLoading" :data="tableData" border fit highlight-current-row style="width: 100%">
      <el-table-column label="序号" width="70" align="center">
        <template slot-scope="scope">
          {{ (queryParam.pageIndex - 1) * queryParam.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="subjectId" label="学科" :formatter="subjectFormatter" width="140px" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="createTime" label="创建时间" width="160px" />
      <el-table-column label="操作" align="center" width="220px">
        <template slot-scope="{row}">
          <el-button size="mini"
            @click="$router.push({ path: '/exam/paper/edit', query: { id: row.id } })">编辑</el-button>
          <el-button size="mini" type="danger" @click="deletePaper(row)" class="link-left">删除</el-button>
          <el-button size="mini" type="success" @click="showAudioDialog(row)" class="link-left">听力</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="queryParam.pageIndex" :limit.sync="queryParam.pageSize"
      layout="total, prev, pager, next, jumper" @pagination="search" />
    <el-dialog title="选择听力音频" :visible.sync="audioDialogVisible" width="50%">
      <el-table :data="audioList" border style="width: 100%">
        <el-table-column type="index" label="序号" width="80"></el-table-column>
        <el-table-column prop="fileName" label="音频名称"></el-table-column>
        <el-table-column prop="fileUrl" label="文件URL" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="120">
          <template slot-scope="{row}">
            <el-button size="mini" type="primary" @click="addAudioToPaper(row)">添加</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="audioDialogVisible = false">取消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex'
import Pagination from '@/components/Pagination'
import examPaperApi from '@/api/examPaper'

export default {
  components: { Pagination },
  data () {
    return {
      queryParam: {
        name: '',
        pageIndex: 1,
        pageSize: 10
      },
      listLoading: true,
      tableData: [],
      total: 0,
      audioDialogVisible: false, // 控制对话框显示
      audioList: [], // 音频列表
      currentExamId: null // 当前操作的试卷ID
    }
  },
  created () {
    this.initSubject()
    this.search()
  },
  methods: {
    submitForm () {
      this.queryParam.pageIndex = 1
      this.search()
    },
    search () {
      this.listLoading = true
      examPaperApi.pageList(this.queryParam).then(data => {
        const re = data.response
        this.tableData = re.list
        this.total = re.total
        this.queryParam.pageIndex = re.pageNum
        this.listLoading = false
      })
    },
    deletePaper (row) {
      let _this = this
      examPaperApi.deletePaper(row.id).then(re => {
        if (re.code === 1) {
          _this.search()
          _this.$message.success(re.message)
        } else {
          _this.$message.error(re.message)
        }
      })
    },
    subjectFormatter  (row, column, cellValue, index) {
      return this.subjectEnumFormat(cellValue)
    },
    ...mapActions('exam', { initSubject: 'initSubject' }),
    // 显示音频选择对话框
    showAudioDialog (row) {
      this.currentExamId = row.id
      this.audioDialogVisible = true
      this.loadAudioList()
    },

    // 加载音频列表
    loadAudioList () {
      // 使用新的uploadFileList接口获取文件列表
      examPaperApi.uploadFileList(1, 100, {}).then(response => {
        if (response.code === 1) {
          // 过滤音频文件（根据fileName的扩展名来过滤，或者特定的fileType）
          this.audioList = response.response.items.filter(item => {
            const fileName = item.fileName || ''
            const fileType = item.fileType || ''
            // 根据文件扩展名过滤音频文件，或者特定的fileType（如11002代表音频）
            return fileName.toLowerCase().includes('.mp3') ||
                   fileName.toLowerCase().includes('.wav') ||
                   fileName.toLowerCase().includes('.m4a') ||
                   fileName.toLowerCase().includes('.aac') ||
                   fileName.toLowerCase().includes('.mpeg') ||
                   fileName.toLowerCase().includes('.mp4') ||
                   fileType === '11002' || // 根据数据，11002是音频文件类型？
                   fileType.includes('audio')
          }).sort((a, b) => (a.id || 0) - (b.id || 0))
          console.log('过滤后的音频文件列表:', this.audioList)
          console.log('总文件数:', response.response.items.length)
        } else {
          this.$message.error(response.message || '获取音频列表失败')
        }
      }).catch(error => {
        this.$message.error('获取音频列表失败')
        console.error(error)
      })
    },

    // 添加音频到试卷
    addAudioToPaper (audio) {
      // 现在传递音频的URL而不是ID
      examPaperApi.addAudio(audio.fileUrl, this.currentExamId).then(response => {
        if (response.code === 1) {
          this.$message.success('添加听力成功')
          this.audioDialogVisible = false
        } else {
          this.$message.error(response.message)
        }
      }).catch(error => {
        this.$message.error('添加听力失败')
        console.error(error)
      })
    }
  },
  computed: {
    ...mapGetters('exam', ['subjectEnumFormat']),
    ...mapState('exam', { subjects: state => state.subjects })
  }
}
</script>

<style lang="scss" scoped>
.link-left {
  margin-left: 10px;
}

.audio-name {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 对话框内容的最大高度和滚动 */
.el-dialog__body {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
