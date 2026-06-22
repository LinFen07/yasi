<template>
  <div class="app-container">
    <el-form :model="queryParam" ref="queryForm" :inline="true">
      <el-form-item label="名称：">
        <el-input v-model="queryParam.name" clearable placeholder="请输入试卷名称"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">查询</el-button>
        <el-button type="primary" class="link-left" @click="openUploadAudioDialog">添加听力音频</el-button>
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
    <el-dialog title="选择听力音频" :visible.sync="audioDialogVisible" width="760px" @close="pauseAllAudioPlayers">
      <el-form :inline="true" @submit.native.prevent="searchAudio" class="audio-search-form">
        <el-form-item label="音频名称：">
          <el-input
            v-model="audioQueryParam.audioName"
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
        <el-table-column label="序号" width="70" align="center">
          <template slot-scope="scope">
            {{ (audioQueryParam.pageNo - 1) * audioQueryParam.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="audioName" label="音频名称" min-width="160" show-overflow-tooltip>
          <template slot-scope="{row}">
            {{ row.audioName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="文件" min-width="360">
          <template slot-scope="{row}">
            <audio
              v-if="row.id"
              :key="'audio-' + row.id"
              class="audio-list-player"
              :src="getAudioStreamUrl(row)"
              controls
              controlsList="nodownload"
              preload="metadata"
              @play="handleAudioPlay"
              @error="handleAudioError(row)"
            ></audio>
            <span v-else>-</span>
          </template>
        </el-table-column>
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

    <el-dialog
      title="上传听力音频"
      :visible.sync="uploadAudioDialogVisible"
      width="480px"
      :close-on-click-modal="!uploadAudioSubmitting"
      :show-close="!uploadAudioSubmitting"
      :before-close="handleUploadAudioDialogClose"
    >
      <el-form
        ref="uploadAudioForm"
        :model="uploadAudioForm"
        :rules="uploadAudioRules"
        label-width="100px"
        v-loading="uploadAudioSubmitting"
        element-loading-text="上传中..."
      >
        <el-form-item label="音频名称：" prop="audioName">
          <el-input v-model="uploadAudioForm.audioName" placeholder="请输入音频名称" maxlength="100"></el-input>
        </el-form-item>
        <el-form-item label="音频文件：" prop="file">
          <el-upload
            ref="audioUpload"
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".mp3,.wav,.m4a,.aac,.mpeg,.mp4"
            :on-change="handleAudioFileChange"
            :on-remove="handleAudioFileRemove"
            :file-list="uploadAudioFileList"
          >
            <el-button size="small" type="primary">选择文件</el-button>
            <div slot="tip" class="el-upload__tip">支持 mp3、wav、m4a、aac、mpeg、mp4，不超过 500MB</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleUploadAudioDialogClose()" :disabled="uploadAudioSubmitting">取消</el-button>
        <el-button type="primary" @click="submitUploadAudio" :loading="uploadAudioSubmitting">上传</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex'
import Pagination from '@/components/Pagination'
import examPaperApi from '@/api/examPaper'
import uploadApi from '@/api/upload'

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
        pageSize: 5,
        audioName: ''
      },
      currentExamId: null, // 当前操作的试卷ID
      uploadAudioDialogVisible: false,
      uploadAudioSubmitting: false,
      uploadAudioFileList: [],
      uploadAudioForm: {
        audioName: '',
        file: null
      },
      uploadAudioRules: {
        audioName: [
          { required: true, message: '请输入音频名称', trigger: 'blur' }
        ],
        file: [
          {
            validator: (rule, value, callback) => {
              if (!this.uploadAudioForm.file) {
                callback(new Error('请选择音频文件'))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      }
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
    openUploadAudioDialog () {
      this.resetUploadAudioForm()
      this.uploadAudioDialogVisible = true
    },
    resetUploadAudioForm () {
      this.uploadAudioForm = {
        audioName: '',
        file: null
      }
      this.uploadAudioFileList = []
      this.uploadAudioSubmitting = false
      this.$nextTick(() => {
        if (this.$refs.uploadAudioForm) {
          this.$refs.uploadAudioForm.clearValidate()
        }
        if (this.$refs.audioUpload) {
          this.$refs.audioUpload.clearFiles()
        }
      })
    },
    handleUploadAudioDialogClose (done) {
      if (this.uploadAudioSubmitting) {
        return
      }
      this.uploadAudioDialogVisible = false
      this.resetUploadAudioForm()
      if (typeof done === 'function') {
        done()
      }
    },
    handleAudioFileChange (file, fileList) {
      if (file.size > uploadApi.MAX_AUDIO_SIZE) {
        this.$message.error('音频大小不能超过500MB')
        this.uploadAudioFileList = []
        this.uploadAudioForm.file = null
        if (this.$refs.audioUpload) {
          this.$refs.audioUpload.clearFiles()
        }
        return
      }
      this.uploadAudioFileList = fileList.slice(-1)
      this.uploadAudioForm.file = file.raw
      this.$refs.uploadAudioForm && this.$refs.uploadAudioForm.validateField('file')
    },
    handleAudioFileRemove () {
      this.uploadAudioFileList = []
      this.uploadAudioForm.file = null
      this.$refs.uploadAudioForm && this.$refs.uploadAudioForm.validateField('file')
    },
    submitUploadAudio () {
      this.$refs.uploadAudioForm.validate(async (valid) => {
        if (!valid) return
        this.uploadAudioSubmitting = true
        try {
          const res = await uploadApi.uploadAudio(
            this.uploadAudioForm.file,
            this.uploadAudioForm.audioName.trim()
          )
          if (uploadApi.isUploadSuccess(res)) {
            this.$message.success('上传听力音频成功')
            this.uploadAudioDialogVisible = false
            this.resetUploadAudioForm()
          } else {
            this.$message.error(res.message || '上传听力音频失败')
          }
        } catch (error) {
          this.$message.error(error.message || '上传听力音频失败')
        } finally {
          this.uploadAudioSubmitting = false
        }
      })
    },
    // 显示音频选择对话框
    showAudioDialog (row) {
      this.currentExamId = row.id
      this.audioQueryParam.pageNo = 1
      this.audioQueryParam.audioName = ''
      this.audioDialogVisible = true
      this.loadAudioList()
    },

    searchAudio () {
      this.audioQueryParam.pageNo = 1
      this.loadAudioList()
    },

    loadAudioList () {
      this.pauseAllAudioPlayers()
      this.audioListLoading = true
      const params = { isAudio: 1 }
      const audioName = (this.audioQueryParam.audioName || '').trim()
      if (audioName) {
        params.audioName = audioName
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

    handleAudioPlay (event) {
      const current = event.target
      const players = document.querySelectorAll('.audio-list-player')
      players.forEach(player => {
        if (player !== current && !player.paused) {
          player.pause()
        }
      })
    },

    getAudioStreamUrl (row) {
      if (!row || !row.id) return ''
      return examPaperApi.getAudioStreamUrl(row.id)
    },

    handleAudioError (row) {
      this.$message.error(`音频「${row.audioName || row.id}」加载失败，请确认后端已启动且文件存在`)
    },

    pauseAllAudioPlayers () {
      document.querySelectorAll('.audio-list-player').forEach(player => {
        player.pause()
        player.currentTime = 0
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

.audio-list-player {
  width: 100%;
  max-width: 360px;
  height: 32px;
  vertical-align: middle;
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
