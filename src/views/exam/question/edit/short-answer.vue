<template>
  <div class="app-container">
    <QuestionEditHeader :question-type="7" />
    <el-form :model="form" ref="form" label-width="100px" v-loading="formLoading" :rules="rules">
      <el-form-item label="年级：" prop="gradeLevel" required>
        <el-select v-model="form.gradeLevel" placeholder="年级" @change="levelChange">
          <el-option v-for="item in levelEnum" :key="item.key" :value="item.key" :label="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="学科：" prop="subjectId" required>
        <el-select v-model="form.subjectId" placeholder="学科">
          <el-option v-for="item in subjectFilter" :key="item.id" :value="item.id"
            :label="item.name + ' ( ' + item.levelName + ' )'"></el-option>
        </el-select>
      </el-form-item>

      <QuestionPaperFields :form="form" />

      <!-- 题干富文本编辑器 -->
      <el-form-item label="题干：" prop="title" required>
        <div style="width: 80%; border: 1px solid #ccc">
          <div id="titleEditor" style="height: 300px;"></div>
        </div>
      </el-form-item>

      <!-- 解析改为普通输入框 -->
      <el-form-item label="解析：" prop="analyze" required>
        <el-input v-model="form.analyze" />
      </el-form-item>

      <el-form-item label="分数：" prop="score" required>
        <el-input-number v-model="form.score" :precision="1" :step="1" :max="100"></el-input-number>
      </el-form-item>
      <el-form-item label="难度：" required>
        <el-rate v-model="form.difficult" class="question-item-rate"></el-rate>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">重置</el-button>
        <el-button type="success" @click="showQuestion">预览</el-button>
      </el-form-item>
    </el-form>

    <QuestionPreviewDialog
      :visible.sync="questionShow.dialog"
      :q-type="questionShow.qType"
      :question="questionShow.question"
      :q-loading="questionShow.loading"
    />
  </div>
</template>

<script>
import QuestionPreviewDialog from '../components/QuestionPreviewDialog'
import QuestionPaperFields from '../components/QuestionPaperFields'
import QuestionEditHeader from '../components/QuestionEditHeader'
import questionEditPage from '../mixins/questionEditPage'
import { mapGetters, mapState, mapActions } from 'vuex'
import questionApi from '@/api/question'
import uploadApi from '@/api/upload'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

export default {
  mixins: [questionEditPage],
  components: {
    QuestionPreviewDialog,
    QuestionPaperFields,
    QuestionEditHeader
  },
  data () {
    return {
      form: {
        id: null,
        questionType: 7,
        gradeLevel: null,
        subjectId: null,
        topicType: 7,
        paperName: '',
        moduleType: null,
        partNo: null,
        title: '',
        items: [],
        analyze: '',
        score: '',
        difficult: 1
      },
      subjectFilter: null,
      formLoading: false,
      rules: {
        gradeLevel: [
          { required: true, message: '请选择年级', trigger: 'change' }
        ],
        subjectId: [
          { required: true, message: '请选择学科', trigger: 'change' }
        ],
        topicType: [
          { required: false, message: '请选择题型', trigger: 'change' }
        ],
        title: [
          { required: true, message: '请输入题干', trigger: 'blur' }
        ],
        analyze: [
          { required: false, message: '请输入解析', trigger: 'blur' }
        ],
        score: [
          { required: true, message: '请输入分数', trigger: 'blur' }
        ]
      },
      questionShow: {
        qType: 0,
        dialog: false,
        question: null,
        loading: false
      },
      // Quill 编辑器实例
      titleQuill: null,
      // 工具栏配置
      toolbarOptions: [
        ['bold', 'italic', 'underline', 'strike'], // 加粗、斜体、下划线、删除线
        ['blockquote', 'code-block'], // 引用、代码块

        [{ 'header': 1 }, { 'header': 2 }], // 标题1、标题2
        [{ 'list': 'ordered' }, { 'list': 'bullet' }], // 有序列表、无序列表
        [{ 'script': 'sub' }, { 'script': 'super' }], // 上标、下标
        [{ 'indent': '-1' }, { 'indent': '+1' }], // 缩进
        [{ 'direction': 'rtl' }], // 文本方向

        [{ 'size': ['small', false, 'large', 'huge'] }], // 字体大小
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }], // 标题级别

        [{ 'color': [] }, { 'background': [] }], // 字体颜色、背景色
        [{ 'font': [] }], // 字体
        [{ 'align': [] }], // 对齐方式

        ['clean'], // 清除格式
        ['link', 'image', 'video'] // 链接、图片、视频
      ]
    }
  },
  mounted () {
    this.initEditor()
  },
  created () {
    let id = this.$route.query.id
    let _this = this
    this.bootstrapQuestionEdit()
    if (id && parseInt(id) !== 0) {
      _this.formLoading = true
      questionApi.select(id).then(re => {
        if (!_this.ensureQuestionTypePage(re.response, 7)) return
        _this.form = re.response
        _this.updateSubjectFilter()
        _this.$nextTick(() => {
          if (_this.titleQuill) {
            _this.titleQuill.root.innerHTML = _this.form.title || ''
          }
        })
        _this.formLoading = false
      })
    }
  },
  methods: {
    initEditor () {
      // 初始化题干编辑器
      this.titleQuill = new Quill('#titleEditor', {
        theme: 'snow',
        modules: {
          toolbar: this.toolbarOptions
        },
        placeholder: '请输入题干内容...'
      })

      // 监听内容变化并同步到form
      this.titleQuill.on('text-change', () => {
        this.form.title = this.titleQuill.root.innerHTML
      })

      // 设置图片上传处理
      const handleImageUpload = (quillInstance) => {
        const input = document.createElement('input')
        input.setAttribute('type', 'file')
        input.setAttribute('accept', 'image/*')
        input.click()

        input.onchange = async () => {
          const file = input.files[0]
          if (!file) return

          // 客户端验证
          const MAX_SIZE = 3 * 1024 * 1024 // 3MB
          if (file.size > MAX_SIZE) {
            this.$message.error('图片大小不能超过3M')
            return
          }

          try {
            const loading = this.$loading({
              lock: true,
              text: '图片上传中...',
              spinner: 'el-icon-loading',
              background: 'rgba(0, 0, 0, 0.7)'
            })

            const res = await uploadApi.upload(file) // 直接传递file对象
            loading.close()

            // 修改判断条件为code === 0
            const imageUrl = uploadApi.getImageUrl(res)
            if (imageUrl) {
              const range = quillInstance.getSelection()
              quillInstance.insertEmbed(range.index, 'image', imageUrl)
              this.$message.success('图片上传成功')
            } else {
              this.$message.error(res.message || '图片上传失败')
            }
          } catch (error) {
            console.error('上传详细错误:', {
              error: error,
              request: error.config,
              response: error.response?.data,
              message: error.message
            })

            let errorMsg = '图片上传失败'
            if (error.response) {
              errorMsg = error.response.data?.message ||
                `服务器错误: ${error.response.status}`
            } else if (error.request) {
              errorMsg = '请求发送失败，请检查网络'
            }

            this.$message.error(errorMsg)
          }
        }
      }

      // 重写图片处理
      const titleToolbar = this.titleQuill.getModule('toolbar')
      titleToolbar.addHandler('image', () => handleImageUpload(this.titleQuill))
    },

    submitForm () {
      let _this = this
      this.$refs.form.validate((valid) => {
        if (valid) {
          // 确保获取最新的编辑器内容
          this.form.title = this.titleQuill.root.innerHTML
          this.finalizeQuestionForm(this.form)

          this.formLoading = true
          questionApi.edit(this.form).then(re => {
            if (re.code === 1) {
              _this.$message.success(re.message)
              _this.delCurrentView(_this).then(() => {
                _this.$router.push('/exam/question/list')
              })
            } else {
              _this.$message.error(re.message)
              this.formLoading = false
            }
          }).catch(e => {
            this.formLoading = false
          })
        } else {
          return false
        }
      })
    },

    resetForm () {
      let lastId = this.form.id
      this.$refs['form'].resetFields()
      this.form = {
        id: null,
        questionType: 7,
        gradeLevel: null,
        subjectId: null,
        topicType: 7,
        paperName: '',
        moduleType: null,
        partNo: null,
        title: '',
        items: [],
        analyze: '',
        score: '',
        difficult: 1
      }
      this.form.id = lastId

      // 清空编辑器内容
      if (this.titleQuill) {
        this.titleQuill.root.innerHTML = ''
      }
    },

    showQuestion () {
      // 确保获取最新的编辑器内容
      this.form.title = this.titleQuill.root.innerHTML

      this.questionShow.dialog = true
      this.questionShow.qType = this.form.questionType
      this.questionShow.question = this.form
    },

    // beforeDestroy () {
    //   // 组件销毁时，清理编辑器实例
    //   if (this.titleQuill) {
    //     this.titleQuill = null
    //   }
    // },

    ...mapActions('exam', { initSubject: 'initSubject' }),
    ...mapActions('tagsView', { delCurrentView: 'delCurrentView' })
  },
  computed: {
    ...mapGetters('enumItem', ['enumFormat']),
    ...mapState('enumItem', {
      questionTypeEnum: state => state.exam.question.queTypeEnum,
      levelEnum: state => state.user.levelEnum
    }),
    ...mapState('exam', { subjects: state => state.subjects })
  },
  beforeDestroy () {
    // 组件销毁时，清理编辑器实例
    if (this.titleQuill) {
      this.titleQuill = null
    }
  }
}
</script>

<style>
/* 添加Quill编辑器样式覆盖（如果需要） */
.ql-editor {
  min-height: 300px;
}

.question-item-label {
  margin-bottom: 10px;
}

.question-item-content-input {
  width: 60%;
  margin-left: 10px;
}

.question-item-remove {
  margin-left: 10px;
}

.question-item-rate {
  margin-top: 10px;
}
</style>
