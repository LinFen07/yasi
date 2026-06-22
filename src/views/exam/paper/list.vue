<template>
  <div class="app-container">
    <el-form :model="queryParam" ref="queryForm" :inline="true">
      <el-form-item label="名称：">
        <el-input v-model="queryParam.name" clearable placeholder="请输入试卷名称"></el-input>
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
      <el-table-column prop="subjectId" label="学科" :formatter="subjectFormatter" width="140px" />
      <el-table-column prop="name" label="名称" />
      <el-table-column label="听力试题" width="150" align="center">
        <template slot-scope="{row}">
          <el-tag :type="hasListeningAudio(row) ? 'success' : 'info'" size="mini">
            {{ hasListeningAudio(row) ? '有' : '无' }}
          </el-tag>
          <el-button
            v-if="hasListeningAudio(row)"
            size="mini"
            type="primary"
            class="link-left"
            @click="downloadAudio(row)"
          >下载</el-button>
        </template>
      </el-table-column>
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
      <el-form :inline="true" @submit.native.prevent="searchAudio" class="audio-search-form">
        <el-form-item label="音频名称：">
          <el-input
            v-model="audioQueryParam.fileName"
            clearable
            placeholder="请输入音频名称"
            @keyup.enter.native="searchAudio"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchAudio">搜索</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="audioListLoading" :data="audioList" border style="width: 100%">
        <el-table-column label="序号" width="80" align="center">
          <template slot-scope="scope">
            {{ (audioQueryParam.pageNo - 1) * audioQueryParam.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="音频名称"></el-table-column>
        <el-table-column prop="fileUrl" label="文件URL" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="120">
          <template slot-scope="{row}">
            <el-button size="mini" type="primary" @click="addAudioToPaper(row)">添加</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="audioTotal > 0"
        :total="audioTotal"
        :page.sync="audioQueryParam.pageNo"
        :limit.sync="audioQueryParam.pageSize"
        layout="total, prev, pager, next, jumper"
        @pagination="loadAudioList"
      />
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
      audioListLoading: false,
      audioTotal: 0,
      audioQueryParam: {
        pageNo: 1,
        pageSize: 10,
        fileName: ''
      },
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
    hasListeningAudio (row) {
      const url = row.audioFileUrl
      return !!(url && String(url).trim())
    },
    downloadAudio (row) {
      const url = row.audioFileUrl
      if (!url || !String(url).trim()) {
        this.$message.warning('暂无听力音频')
        return
      }
      const fileName = decodeURIComponent(url.split('/').pop().split('?')[0]) || 'audio'
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.target = '_blank'
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    ...mapActions('exam', { initSubject: 'initSubject' }),
    // 显示音频选择对话框
    showAudioDialog (row) {
      this.currentExamId = row.id
      this.audioQueryParam.pageNo = 1
      this.audioQueryParam.fileName = ''
      this.audioDialogVisible = true
      this.loadAudioList()
    },

    searchAudio () {
      this.audioQueryParam.pageNo = 1
      this.loadAudioList()
    },

    loadAudioList () {
      this.audioListLoading = true
      const params = { isAudio: 1 }
      const fileName = (this.audioQueryParam.fileName || '').trim()
      if (fileName) {
        params.fileName = fileName
      }
      examPaperApi.uploadFileList(
        this.audioQueryParam.pageNo,
        this.audioQueryParam.pageSize,
        params
      ).then(response => {
        if (response.code === 1) {
          const re = response.response
          this.audioList = re.items || []
          this.audioTotal = re.counts || 0
          this.audioQueryParam.pageNo = re.pageNo || this.audioQueryParam.pageNo
        } else {
          this.$message.error(response.message || '获取音频列表失败')
        }
        this.audioListLoading = false
      }).catch(error => {
        this.audioListLoading = false
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
          this.search()
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

.audio-search-form {
  margin-bottom: 12px;
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
