<template>
  <div class="app-container">
    <QuestionEditHeader :question-type="5" />
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

      <QuestionPaperFields :form="form" />

      <!-- 题干富文本编辑器 -->
      <el-form-item label="题干：" prop="title" required>
        <div style="width: 80%; border: 1px solid #ccc">
          <div id="titleEditor" style="height: 200px;"></div>
        </div>
        <div class="tip-text">请在此输入与题目相关的图片，图片将显示在学生端的表格上方</div>
      </el-form-item>

      <!-- 题目内容表格 -->
      <el-form-item label="题目内容：" required>
        <div class="question-table-wrapper">
          <el-table :data="form.items" border style="width: 100">
            <el-table-column label="题号" width="80" align="center">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.questionNo"
                  type="number"
                  :min="1"
                  size="mini"
                  style="width: 60px"
                />
              </template>
            </el-table-column>
            <el-table-column label="题目内容" min-width="300">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.question"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入题目内容"
                />
              </template>
            </el-table-column>
            <el-table-column
              v-for="col in optionColumns"
              :key="col"
              :label="col"
              width="60"
              align="center"
            >
              <template slot-scope="scope">
                <el-checkbox
                  :value="scope.row.correct === col"
                  @change="(val) => handleCellClick(scope.$index, col, val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button
                  type="danger"
                  size="mini"
                  icon="el-icon-delete"
                  @click="removeQuestion(scope.$index)"
                  :disabled="form.items.length <= 1"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="table-legend">
          <span>点击单元格勾选正确答案，表格将按 A-I 列显示选项</span>
          <el-button type="primary" size="mini" @click="addQuestion" class="add-question-btn">
            添加小题
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="解析：" prop="analyze" required>
        <el-input v-model="form.analyze" />
      </el-form-item>

      <el-form-item label="分数：" prop="score" required>
        <el-input-number v-model="form.score" :precision="1" :step="1" :max="100" :min="1" />
        <span class="score-hint">每道小题 {{ getScorePerQuestion() }} 分</span>
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
        questionType: 5,
        gradeLevel: null,
        subjectId: null,
        topicType: 5,
        paperName: '',
        moduleType: null,
        partNo: null,
        title: '',
        // items 格式：每行一个小题，{ question: 题目文本, questionNo: 题号, correct: 正确答案列 }
        items: [
          { questionNo: 1, question: '', correct: '' }
        ],
        analyze: '',
        score: 1,
        difficult: 1
      },
      // 表格列 A-I
      optionColumns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
      subjectFilter: null,
      formLoading: false,
      rules: {
        gradeLevel: [
          { required: true, message: '请选择年级', trigger: 'change' }
        ],
        subjectId: [
          { required: true, message: '请选择学科', trigger: 'change' }
        ],
        title: [
          { required: true, message: '请输入题干', trigger: 'blur' }
        ],
        analyze: [
          { required: true, message: '请输入解析', trigger: 'blur' }
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
      titleQuill: null,
      toolbarOptions: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['link', 'image', 'video']
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
        if (!_this.ensureQuestionTypePage(re.response, 5)) return
        const data = re.response
        _this.form = {
          ..._this.form,
          ...data,
          items: _this.parseItemsForPick(data.items || [], data.correct || '')
        }
        _this.updateSubjectFilter()
        _this.$nextTick(() => {
          if (_this.titleQuill) {
            _this.titleQuill.root.innerHTML = _this.form.title || ''
          }
        })
        _this.formLoading = false
      }).catch(() => {
        _this.formLoading = false
      })
    }
  },
  methods: {
    initEditor () {
      this.titleQuill = new Quill('#titleEditor', {
        theme: 'snow',
        modules: {
          toolbar: this.toolbarOptions
        },
        placeholder: '请输入题干内容（可上传图片）...'
      })

      this.titleQuill.on('text-change', () => {
        this.form.title = this.titleQuill.root.innerHTML
      })

      const handleImageUpload = (quillInstance) => {
        const input = document.createElement('input')
        input.setAttribute('type', 'file')
        input.setAttribute('accept', 'image/*')
        input.click()

        input.onchange = async () => {
          const file = input.files[0]
          if (!file) return

          const MAX_SIZE = 3 * 1024 * 1024
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

      const titleToolbar = this.titleQuill.getModule('toolbar')
      titleToolbar.addHandler('image', () => handleImageUpload(this.titleQuill))
    },
    // 解析已有的 items 数据（从旧格式转换）
    parseItemsForPick (items, correct) {
      if (!items || items.length === 0) {
        return [{ questionNo: 1, question: '', correct: '' }]
      }
      // items 格式可能是 [{ prefix, content }]，需要转换
      if (items[0] && items[0].prefix && items[0].content !== undefined) {
        // 旧格式，尝试解析
        const result = []
        items.forEach((item, idx) => {
          result.push({
            questionNo: idx + 1,
            question: item.content || '',
            correct: ''
          })
        })
        // 尝试从 correct 解析正确答案
        if (correct) {
          const correctArr = String(correct).split(',').map(s => s.trim())
          // 这里需要根据实际数据结构处理
        }
        return result.length > 0 ? result : [{ questionNo: 1, question: '', correct: '' }]
      }
      return items
    },
    // 点击单元格切换答案
    handleCellClick (rowIndex, col, checked) {
      const item = this.form.items[rowIndex]
      if (checked) {
        item.correct = col
      } else {
        item.correct = ''
      }
      // 触发响应式更新
      this.$set(this.form.items, rowIndex, { ...item })
    },
    // 添加小题
    addQuestion () {
      const lastItem = this.form.items[this.form.items.length - 1]
      const nextNo = lastItem ? (Number(lastItem.questionNo) || 0) + 1 : 1
      this.form.items.push({ questionNo: nextNo, question: '', correct: '' })
    },
    // 删除小题
    removeQuestion (index) {
      if (this.form.items.length > 1) {
        this.form.items.splice(index, 1)
      }
    },
    // 计算每道小题的分数
    getScorePerQuestion () {
      const total = Number(this.form.score) || 1
      const count = this.form.items.length
      return (total / count).toFixed(1)
    },
    // 提交前格式化数据
    finalizeFormData () {
      const formData = { ...this.form }
      // 计算总题数
      const questionCount = formData.items.length
      // 每道题分数
      const scorePerQuestion = Number(formData.score) || 1
      // 将 items 转换为后端需要的格式
      // 假设后端期望 items 为选项列表，correct 为逗号分隔的答案
      formData.items = this.form.items.map((item, idx) => ({
        prefix: String.fromCharCode(65 + idx), // A, B, C...
        content: item.question
      }))
      // 收集所有正确答案
      formData.correct = this.form.items
        .filter(item => item.correct)
        .map(item => item.correct)
        .join(',')
      // 总分 = 每题分数 × 题数
      formData.score = scorePerQuestion * questionCount
      return formData
    },
    submitForm () {
      let _this = this
      this.$refs.form.validate((valid) => {
        if (valid) {
          // 检查题目内容
          const emptyQuestions = this.form.items.filter(item => !item.question.trim())
          if (emptyQuestions.length > 0) {
            this.$message.warning('请填写所有小题的题目内容')
            return
          }
          // 检查是否有正确答案
          const unansweredQuestions = this.form.items.filter(item => !item.correct)
          if (unansweredQuestions.length > 0) {
            this.$message.warning('请为所有小题设置正确答案')
            return
          }

          this.form.title = this.titleQuill.root.innerHTML
          const submitData = this.finalizeFormData()
          this.finalizeQuestionForm(submitData)

          this.formLoading = true
          questionApi.edit(submitData).then(re => {
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
        }
      })
    },
    resetForm () {
      let lastId = this.form.id
      this.$refs['form'].resetFields()
      this.form = {
        id: null,
        questionType: 5,
        gradeLevel: null,
        subjectId: null,
        topicType: 5,
        paperName: '',
        moduleType: null,
        partNo: null,
        title: '',
        items: [{ questionNo: 1, question: '', correct: '' }],
        analyze: '',
        score: 1,
        difficult: 1
      }
      this.form.id = lastId

      if (this.titleQuill) {
        this.titleQuill.root.innerHTML = ''
      }
    },
    showQuestion () {
      this.form.title = this.titleQuill.root.innerHTML
      // 构建预览数据结构
      const previewQuestion = {
        ...this.form,
        items: this.form.items.map((item, idx) => ({
          prefix: String.fromCharCode(65 + idx),
          content: item.question,
          questionNo: item.questionNo
        }))
      }
      this.questionShow.dialog = true
      this.questionShow.qType = this.form.questionType
      this.questionShow.question = previewQuestion
    },
    ...mapActions('exam', { initSubject: 'initSubject' }),
    ...mapActions('tagsView', { delCurrentView: 'delCurrentView' })
  },
  computed: {
    ...mapGetters('enumItem', ['enumFormat']),
    ...mapState('enumItem', {
      questionTypeEnum: state => state.exam.question.typeEnum,
      levelEnum: state => state.user.levelEnum
    }),
    ...mapState('exam', { subjects: state => state.subjects })
  },
  beforeDestroy () {
    if (this.titleQuill) {
      this.titleQuill = null
    }
  }
}
</script>

<style scoped>
.ql-editor {
  min-height: 200px;
}

.tip-text {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.question-table-wrapper {
  margin-bottom: 10px;
}

.table-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
  margin-top: 10px;
}

.add-question-btn {
  margin-left: auto;
}

.score-hint {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.question-item-rate {
  margin-top: 10px;
}
</style>
