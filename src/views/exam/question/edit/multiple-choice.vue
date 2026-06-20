<template>
  <div class="app-container">
    <el-form :model="form" ref="form" label-width="100px" v-loading="formLoading" :rules="rules">
      <el-form-item label="年级：" prop="gradeLevel" required>
        <el-select v-model="form.gradeLevel" placeholder="年级" @change="levelChange" clearable>
          <el-option v-for="item in levelEnum" :key="item.key" :value="item.key" :label="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="学科：" prop="subjectId" required>
        <el-select v-model="form.subjectId" placeholder="学科">
          <el-option v-for="item in subjectFilter" :key="item.id" :value="item.id"
            :label="item.name + ' ( ' + item.levelName + ' )'"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="题目类型：" prop="topicType" required>
        <el-select v-model="form.topicType" placeholder="题目类型">
          <el-option v-for="item in queTypeEnum" :key="item.key" :value="item.key" :label="item.value"></el-option>
        </el-select>
      </el-form-item>

      <!-- 题干富文本编辑器 -->
      <el-form-item label="题干：" prop="title" required>
        <div style="width: 80%; border: 1px solid #ccc">
          <div id="titleEditor" style="height: 300px;"></div>
        </div>
      </el-form-item>

      <el-form-item label="选项：" required>
        <el-form-item :label="item.prefix" :key="item.prefix" v-for="(item, index) in form.items" label-width="50px"
          class="question-item-label">
          <el-input v-model="item.prefix" style="width:50px;" />
          <el-input v-model="item.content" class="question-item-content-input" />
          <el-button type="danger" size="mini" class="question-item-remove" icon="el-icon-delete"
            @click="questionItemRemove(index)"></el-button>
        </el-form-item>
      </el-form-item>

      <el-form-item label="解析：" prop="analyze" required>
        <el-input v-model="form.analyze" />
      </el-form-item>

      <el-form-item label="分数：" prop="score" required>
        <el-input-number v-model="form.score" :precision="1" :step="1" :max="100"></el-input-number>
      </el-form-item>
      <el-form-item label="难度：" required>
        <el-rate v-model="form.difficult" class="question-item-rate"></el-rate>
      </el-form-item>
      <el-form-item label="正确答案：" prop="correctArray" required>
        <el-checkbox-group v-model="form.correctArray">
          <el-checkbox v-for="item in form.items" :label="item.prefix" :key="item.prefix">{{ item.prefix
            }}</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">重置</el-button>
        <el-button type="success" @click="questionItemAdd">添加选项</el-button>
        <el-button type="success" @click="showQuestion">预览</el-button>
      </el-form-item>
    </el-form>

    <el-dialog :visible.sync="questionShow.dialog" style="width: 100%;height: 100%">
      <QuestionShow :qType="questionShow.qType" :question="questionShow.question" :qLoading="questionShow.loading" />
    </el-dialog>
  </div>
</template>

<script>
import QuestionShow from '../components/Show'
import { mapGetters, mapState, mapActions } from 'vuex'
import questionApi from '@/api/question'
import uploadApi from '@/api/upload'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

export default {
  components: {
    QuestionShow
  },
  data () {
    return {
      form: {
        id: null,
        questionType: 2, // 多选题类型为2
        gradeLevel: null,
        subjectId: null,
        topicType: null,
        title: '',
        items: [
          { prefix: 'A', content: '' },
          { prefix: 'B', content: '' },
          { prefix: 'C', content: '' },
          { prefix: 'D', content: '' }
        ],
        analyze: '',
        correctArray: [],
        score: '',
        difficult: 0
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
          { required: true, message: '请选择题型', trigger: 'change' }
        ],
        title: [
          { required: true, message: '请输入题干', trigger: 'blur' }
        ],
        analyze: [
          { required: true, message: '请输入解析', trigger: 'blur' }
        ],
        score: [
          { required: true, message: '请输入分数', trigger: 'blur' }
        ],
        correctArray: [
          { required: true, message: '请选择正确答案', trigger: 'change' }
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
    this.initSubject(function () {
      _this.subjectFilter = _this.subjects
    })
    if (id && parseInt(id) !== 0) {
      _this.formLoading = true
      questionApi.select(id).then(re => {
        _this.form = re.response
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

            const res = await uploadApi.upload(file)
            loading.close()

            const imageUrl = uploadApi.getImageUrl(res)
            if (imageUrl) {
              const range = quillInstance.getSelection()
              quillInstance.insertEmbed(range.index, 'image', imageUrl)
              this.$message.success('图片上传成功')
            } else {
              this.$message.error(res.message || '图片上传失败')
            }
          } catch (error) {
            console.error('上传详细错误:', error)
            this.$message.error('图片上传失败')
          }
        }
      }

      // 重写图片处理
      const titleToolbar = this.titleQuill.getModule('toolbar')
      titleToolbar.addHandler('image', () => handleImageUpload(this.titleQuill))
    },
    questionItemRemove (index) {
      this.form.items.splice(index, 1)
    },
    questionItemAdd () {
      let items = this.form.items
      let newLastPrefix
      if (items.length > 0) {
        let last = items[items.length - 1]
        newLastPrefix = String.fromCharCode(last.prefix.charCodeAt() + 1)
      } else {
        newLastPrefix = 'A'
      }
      items.push({ id: null, prefix: newLastPrefix, content: '' })
    },
    submitForm () {
      let _this = this
      this.$refs.form.validate((valid) => {
        if (valid) {
          // 确保获取最新的编辑器内容
          this.form.title = this.titleQuill.root.innerHTML

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
        questionType: 2,
        gradeLevel: null,
        subjectId: null,
        topicType: null,
        title: '',
        items: [
          { prefix: 'A', content: '' },
          { prefix: 'B', content: '' },
          { prefix: 'C', content: '' },
          { prefix: 'D', content: '' }
        ],
        analyze: '',
        correctArray: [],
        score: '',
        difficult: 0
      }
      this.form.id = lastId

      // 清空编辑器内容
      if (this.titleQuill) {
        this.titleQuill.root.innerHTML = ''
      }
    },
    levelChange () {
      this.form.subjectId = null
      this.subjectFilter = this.subjects.filter(data => data.level === this.form.gradeLevel)
    },
    showQuestion () {
      // 确保获取最新的编辑器内容
      this.form.title = this.titleQuill.root.innerHTML

      this.questionShow.dialog = true
      this.questionShow.qType = this.form.questionType
      this.questionShow.question = this.form
    },
    ...mapActions('exam', { initSubject: 'initSubject' }),
    ...mapActions('tagsView', { delCurrentView: 'delCurrentView' })
  },
  computed: {
    ...mapGetters('enumItem', ['enumFormat']),
    ...mapState('enumItem', {
      questionTypeEnum: state => state.exam.question.typeEnum,
      levelEnum: state => state.user.levelEnum,
      queTypeEnum: state => state.exam.question.queTypeEnum
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
/* 添加Quill编辑器样式覆盖 */
.ql-editor {
  min-height: 300px;
}

.question-item-label {
  margin-bottom: 10px;
}

.question-item-content-input {
  width: 80%;
  margin-left: 10px;
}

.question-item-remove {
  margin-left: 10px;
}

.question-item-rate {
  margin-top: 10px;
}
</style>
