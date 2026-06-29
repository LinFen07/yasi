<template>
  <div class="app-container">
    <QuestionEditHeader :question-type="6" />
    <el-form :model="form" ref="form" label-width="110px" v-loading="formLoading" :rules="rules">
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

      <el-form-item label="题干：" prop="title" required>
        <div class="title-editor-wrap">
          <div id="titleEditor"></div>
        </div>
        <div class="form-tip">只写题目总说明即可，如 Questions 17-20: What ability is required…</div>
      </el-form-item>

      <el-form-item label="右侧选项：" required>
        <div class="section-tip">学生从右侧拖入选项，此处配置 A、B、C… 及英文内容</div>
        <el-table :data="form.optionItems" border size="small" class="drag-option-table">
          <el-table-column label="选项" width="80" align="center">
            <template slot-scope="{ row }">
              <el-input v-model="row.prefix" placeholder="A" />
            </template>
          </el-table-column>
          <el-table-column label="选项内容">
            <template slot-scope="{ row }">
              <el-input v-model="row.content" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="70" align="center">
            <template slot-scope="{ $index }">
              <el-button type="danger" size="mini" icon="el-icon-delete" @click="removeOption($index)" />
            </template>
          </el-table-column>
        </el-table>
        <el-button type="success" size="mini" class="table-add-btn" @click="addOption">添加选项</el-button>
      </el-form-item>

      <el-form-item label="配对填空：" required>
        <div class="section-tip">每行录入题号、左侧描述（可插入空位标出拖放位置）、正确选项</div>
        <el-table :data="form.promptItems" border size="small" class="drag-prompt-table">
          <el-table-column label="题号" width="88" align="center">
            <template slot-scope="{ row }">
              <el-input v-model="row.prefix" placeholder="17" />
            </template>
          </el-table-column>
          <el-table-column label="左侧描述（含空位）" min-width="320">
            <template slot-scope="{ row, $index }">
              <DragDescribeEditor
                :key="'drag-desc-' + $index + '-' + row.prefix"
                v-model="row.describe"
              />
            </template>
          </el-table-column>
          <el-table-column label="正确选项" width="200" align="center">
            <template slot-scope="{ row }">
              <el-select v-model="row.content" placeholder="选 A/B/C" clearable style="width:100%">
                <el-option
                  v-for="opt in form.optionItems"
                  :key="opt.prefix"
                  :value="opt.prefix"
                  :label="formatOptionLabel(opt)"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="分值" width="100" align="center" class-name="drag-score-col">
            <template slot-scope="{ row }">
              <el-input-number
                v-model="row.score"
                :precision="1"
                :step="1"
                :min="0"
                controls-position="right"
                class="drag-score-input"
                @change="syncTotalScore"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="64" align="center" class-name="drag-action-col">
            <template slot-scope="{ $index }">
              <el-button type="danger" size="mini" icon="el-icon-delete" @click="removePrompt($index)" />
            </template>
          </el-table-column>
        </el-table>
        <div class="table-actions">
          <el-button type="success" size="mini" @click="addPrompt">添加一题</el-button>
        </div>
        <div class="form-tip">题目总分将根据各题分值自动合计</div>
      </el-form-item>

      <el-form-item label="解析：" prop="analyze" required>
        <el-input v-model="form.analyze" />
      </el-form-item>
      <el-form-item label="分数：">
        <span class="drag-total-score">{{ totalScoreText }}</span>
        <span v-if="form.promptItems.length" class="form-tip drag-total-tip">分（自动合计）</span>
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
import DragDescribeEditor from '../components/DragDescribeEditor'
import questionEditPage from '../mixins/questionEditPage'
import { normalizeDragPromptItem } from '../utils/dragPromptDescribe'
import { hasDragSlot } from '../utils/dragSlotMarkup'
import { mapState, mapActions } from 'vuex'
import questionApi from '@/api/question'
import uploadApi from '@/api/upload'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const defaultOptionItems = () => ([
  { prefix: 'A', content: '', itemUuid: 'option' },
  { prefix: 'B', content: '', itemUuid: 'option' },
  { prefix: 'C', content: '', itemUuid: 'option' }
])

const defaultPromptItems = () => ([
  { prefix: '17', describe: '', content: '', score: 1, itemUuid: 'prompt' },
  { prefix: '18', describe: '', content: '', score: 1, itemUuid: 'prompt' },
  { prefix: '19', describe: '', content: '', score: 1, itemUuid: 'prompt' },
  { prefix: '20', describe: '', content: '', score: 1, itemUuid: 'prompt' }
])

export default {
  components: { QuestionPreviewDialog, QuestionPaperFields, QuestionEditHeader, DragDescribeEditor },
  mixins: [questionEditPage],
  data () {
    return {
      form: {
        id: null,
        questionType: 6,
        gradeLevel: null,
        subjectId: null,
        topicType: 6,
        paperName: '',
        moduleType: null,
        partNo: null,
        title: '',
        optionItems: defaultOptionItems(),
        promptItems: defaultPromptItems(),
        items: [],
        analyze: '',
        score: 4,
        difficult: 1
      },
      subjectFilter: null,
      formLoading: false,
      rules: {
        gradeLevel: [{ required: true, message: '请选择年级', trigger: 'change' }],
        subjectId: [{ required: true, message: '请选择学科', trigger: 'change' }],
        title: [{ required: true, message: '请输入题干', trigger: 'blur' }],
        analyze: [{ required: true, message: '请输入解析', trigger: 'blur' }]
      },
      questionShow: { qType: 0, dialog: false, question: null, loading: false },
      titleQuill: null,
      toolbarOptions: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'header': [1, 2, 3, false] }],
        ['link', 'image'],
        ['clean']
      ]
    }
  },
  mounted () {
    this.initEditor()
  },
  created () {
    const id = this.$route.query.id
    this.bootstrapQuestionEdit()
    if (id && parseInt(id) !== 0) {
      this.formLoading = true
      questionApi.select(id).then(re => {
        this.applyLoadedForm(re.response)
        this.formLoading = false
      })
    }
  },
  methods: {
    applyLoadedForm (data) {
      if (!this.ensureQuestionTypePage(data, 6)) return
      const items = data.items || []
      const title = data.title || ''
      this.form = {
        ...data,
        optionItems: items.filter(i => i.itemUuid === 'option'),
        promptItems: items
          .filter(i => i.itemUuid === 'prompt')
          .map(i => normalizeDragPromptItem(i, title))
      }
      if (!this.form.optionItems.length) {
        this.form.optionItems = defaultOptionItems()
      }
      if (!this.form.promptItems.length) {
        this.form.promptItems = defaultPromptItems()
      }
      this.$nextTick(() => {
        if (this.titleQuill) {
          this.titleQuill.root.innerHTML = this.form.title || ''
        }
      })
      this.updateSubjectFilter()
      this.syncTotalScore()
    },
    buildSubmitItems () {
      return [
        ...this.form.promptItems.map(item => ({
          prefix: item.prefix,
          describe: item.describe || '',
          content: item.content,
          score: item.score != null ? String(item.score) : '',
          itemUuid: 'prompt'
        })),
        ...this.form.optionItems.map(item => ({
          prefix: item.prefix,
          content: item.content,
          itemUuid: 'option'
        }))
      ]
    },
    initEditor () {
      this.titleQuill = new Quill('#titleEditor', {
        theme: 'snow',
        modules: { toolbar: this.toolbarOptions },
        placeholder: '请输入题目总说明，如 Questions 17-20 …'
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
          if (file.size > 3 * 1024 * 1024) {
            this.$message.error('图片大小不能超过3M')
            return
          }
          try {
            const loading = this.$loading({ lock: true, text: '图片上传中...', spinner: 'el-icon-loading' })
            const res = await uploadApi.upload(file)
            loading.close()
            const imageUrl = uploadApi.getImageUrl(res)
            if (imageUrl) {
              const range = quillInstance.getSelection()
              quillInstance.insertEmbed(range.index, 'image', imageUrl)
            }
          } catch (e) {
            this.$message.error('图片上传失败')
          }
        }
      }
      this.titleQuill.getModule('toolbar').addHandler('image', () => handleImageUpload(this.titleQuill))
    },
    addOption () {
      const items = this.form.optionItems
      let prefix = 'A'
      if (items.length > 0) {
        prefix = String.fromCharCode(items[items.length - 1].prefix.charCodeAt(0) + 1)
      }
      items.push({ prefix, content: '', itemUuid: 'option' })
    },
    removeOption (index) {
      this.form.optionItems.splice(index, 1)
    },
    addPrompt () {
      const items = this.form.promptItems
      const last = items.length > 0 ? parseInt(items[items.length - 1].prefix, 10) : 0
      const nextNo = Number.isNaN(last) ? items.length + 1 : last + 1
      items.push({ prefix: String(nextNo), describe: '', content: '', score: 1, itemUuid: 'prompt' })
      this.syncTotalScore()
    },
    removePrompt (index) {
      this.form.promptItems.splice(index, 1)
      this.syncTotalScore()
    },
    syncTotalScore () {
      const sum = this.form.promptItems.reduce((total, item) => total + Number(item.score || 0), 0)
      this.form.score = Math.round(sum * 10) / 10
    },
    formatOptionLabel (opt) {
      const text = (opt.content || '').trim()
      return text ? `${opt.prefix}. ${text}` : opt.prefix
    },
    validateDragForm () {
      if (!this.form.optionItems.length) {
        this.$message.error('请至少添加一个选项')
        return false
      }
      if (this.form.optionItems.some(item => !item.content || !String(item.content).trim())) {
        this.$message.error('请填写所有选项内容')
        return false
      }
      if (!this.form.promptItems.length) {
        this.$message.error('请至少添加一个配对项')
        return false
      }
      if (this.form.promptItems.some(item => !item.prefix || String(item.prefix).trim() === '')) {
        this.$message.error('请填写所有题号')
        return false
      }
      if (this.form.promptItems.some(item => !item.describe || !String(item.describe).trim())) {
        this.$message.error('请填写所有配对题的左侧描述')
        return false
      }
      if (this.form.promptItems.some(item => !hasDragSlot(item.describe))) {
        this.$message.error('请为每题左侧描述插入至少一个空位，标出选项拖放位置')
        return false
      }
      if (this.form.promptItems.some(item => !item.content)) {
        this.$message.error('请为每题选择正确选项')
        return false
      }
      this.syncTotalScore()
      return true
    },
    submitForm () {
      this.syncTotalScore()
      this.$refs.form.validate((valid) => {
        if (!valid || !this.validateDragForm()) return
        this.form.title = this.titleQuill.root.innerHTML
        const payload = { ...this.form, items: this.buildSubmitItems() }
        delete payload.optionItems
        delete payload.promptItems
        this.finalizeQuestionForm(payload)
        this.formLoading = true
        questionApi.edit(payload).then(re => {
          if (re.code === 1) {
            this.$message.success(re.message)
            this.delCurrentView(this).then(() => {
              this.$router.push('/exam/question/list')
            })
          } else {
            this.$message.error(re.message)
            this.formLoading = false
          }
        }).catch(() => {
          this.formLoading = false
        })
      })
    },
    resetForm () {
      const lastId = this.form.id
      this.$refs.form.resetFields()
      this.form = {
        id: lastId,
        questionType: 6,
        gradeLevel: null,
        subjectId: null,
        topicType: 6,
        paperName: '',
        moduleType: null,
        partNo: null,
        title: '',
        optionItems: defaultOptionItems(),
        promptItems: defaultPromptItems(),
        items: [],
        analyze: '',
        score: 4,
        difficult: 1
      }
      if (this.titleQuill) this.titleQuill.root.innerHTML = ''
      this.syncTotalScore()
    },
    showQuestion () {
      this.syncTotalScore()
      this.form.title = this.titleQuill.root.innerHTML
      this.questionShow.dialog = true
      this.questionShow.qType = this.form.questionType
      this.questionShow.question = {
        ...this.form,
        items: this.buildSubmitItems()
      }
    },
    ...mapActions('exam', { initSubject: 'initSubject' }),
    ...mapActions('tagsView', { delCurrentView: 'delCurrentView' })
  },
  computed: {
    ...mapState('enumItem', {
      levelEnum: state => state.user.levelEnum
    }),
    ...mapState('exam', { subjects: state => state.subjects }),
    totalScoreText () {
      return Number(this.form.score || 0).toFixed(1)
    }
  },
  beforeDestroy () {
    this.titleQuill = null
  }
}
</script>

<style scoped>
.title-editor-wrap {
  width: 100%;
  max-width: 900px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.form-tip {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}

.inline-tip {
  margin-top: 0;
  margin-left: 10px;
}

.section-tip {
  margin-bottom: 10px;
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}

.drag-option-table,
.drag-prompt-table {
  max-width: 960px;
}

.drag-prompt-table ::v-deep .drag-score-col .cell,
.drag-prompt-table ::v-deep .drag-action-col .cell {
  overflow: visible;
  padding: 8px 6px;
}

.drag-score-input {
  width: 88px;
}

.drag-total-score {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.drag-total-tip {
  margin-left: 8px;
}

.table-add-btn,
.table-actions {
  margin-top: 10px;
}

.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.question-item-rate {
  margin-top: 10px;
}
</style>

<style>
.title-editor-wrap .ql-editor {
  min-height: 200px;
}
</style>
