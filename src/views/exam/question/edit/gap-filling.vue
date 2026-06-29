<template>
  <div class="app-container">
    <QuestionEditHeader :question-type="4" />

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

      <el-form-item label="题干：" prop="title" required>
        <div class="gap-editor-toolbar">
          <el-button type="primary" size="small" :disabled="!editorInstance" @click="insertGap">插入填空</el-button>
          <el-dropdown trigger="click" @command="handleTableTemplate" :disabled="!editorInstance">
            <el-button size="small" :disabled="!editorInstance">
              插入表格模板<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="4x3">4列 × 3行</el-dropdown-item>
              <el-dropdown-item command="1x6">1列 × 6行</el-dropdown-item>
              <el-dropdown-item command="custom" divided>自定义行列…</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <span class="form-tip">表格内可选中文字后点工具栏对齐按钮（居左/居中/居右）；单元格右边界可拖动调列宽</span>
        </div>
        <div class="gap-title-editor">
          <Ueditor :editor-config="gapEditorConfig" @ready="onEditorReady" />
        </div>
      </el-form-item>

      <el-dialog title="自定义表格" :visible.sync="customTableDialog.visible" width="360px" append-to-body>
        <el-form label-width="80px" size="small">
          <el-form-item label="列数">
            <el-input-number v-model="customTableDialog.cols" :min="1" :max="8" />
          </el-form-item>
          <el-form-item label="行数">
            <el-input-number v-model="customTableDialog.rows" :min="2" :max="20" />
          </el-form-item>
          <el-form-item label="表头行">
            <el-switch v-model="customTableDialog.withHeader" />
          </el-form-item>
        </el-form>
        <div slot="footer">
          <el-button @click="customTableDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="insertCustomTable">插入</el-button>
        </div>
      </el-dialog>

      <el-form-item v-if="form.items.length" label="填空答案：" required>
        <el-table :data="form.items" border size="small" class="gap-answer-table">
          <el-table-column prop="prefix" label="题号" width="72" align="center" />
          <el-table-column label="标准答案" min-width="200">
            <template slot-scope="{ row }">
              <el-input v-model="row.content" placeholder="请输入答案（纯文本）" />
            </template>
          </el-table-column>
          <el-table-column label="分值" width="168" align="center" class-name="gap-score-col">
            <template slot-scope="{ row }">
              <el-input-number
                v-model="row.score"
                :precision="1"
                :step="1"
                :min="0"
                :max="100"
                controls-position="right"
                class="gap-score-input"
                @change="syncTotalScore"
              />
            </template>
          </el-table-column>
        </el-table>
        <div class="form-tip">题目总分将根据各空分值自动合计</div>
      </el-form-item>
      <el-alert v-else title="请先在题干中插入至少一个填空" type="info" :closable="false" show-icon class="gap-empty-tip" />

      <el-form-item label="解析：" prop="analyze" required>
        <el-input v-model="form.analyze" type="textarea" :rows="3" placeholder="请输入解析" />
      </el-form-item>
      <el-form-item label="分数：">
        <span class="gap-total-score">{{ totalScoreText }}</span>
        <span v-if="form.items.length" class="form-tip gap-total-tip">分（自动合计）</span>
      </el-form-item>
      <el-form-item label="难度：" required>
        <el-rate v-model="form.difficult" class="question-item-rate"></el-rate>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import QuestionPaperFields from '../components/QuestionPaperFields'
import QuestionEditHeader from '../components/QuestionEditHeader'
import Ueditor from '@/components/Ueditor'
import { mapState, mapActions } from 'vuex'
import questionApi from '@/api/question'
import questionEditPage from '../mixins/questionEditPage'
import { buildGapTableHtml } from '../utils/gapTableTemplate'
import { setupGapTableColumnResize, normalizeGapTables } from '../utils/gapTableColumnResize'
import { setupGapEditorAlignmentInherit } from '../utils/gapEditorAlignment'
import { setupGapEditorTableAlign } from '../utils/gapEditorTableAlign'

const GAP_EDITOR_CONFIG = {
  initialFrameHeight: 440,
  enterTag: 'p',
  toolbars: [[
    'fullscreen', 'source', '|',
    'bold', 'italic', 'underline', 'forecolor', '|',
    'fontfamily', 'fontsize', '|',
    'justifyleft', 'justifycenter', 'justifyright', '|',
    'insertimage', 'inserttable', '|',
    'insertrow', 'deleterow', 'insertcol', 'deletecol', 'mergecells', '|',
    'gapfilling'
  ]]
}

export default {
  mixins: [questionEditPage],
  components: {
    Ueditor,
    QuestionPaperFields,
    QuestionEditHeader
  },
  data () {
    return {
      form: {
        id: null,
        questionType: 4,
        gradeLevel: null,
        subjectId: null,
        topicType: 4,
        paperName: '',
        moduleType: null,
        partNo: null,
        title: '',
        items: [],
        analyze: '',
        correct: '',
        score: 1,
        difficult: 1
      },
      subjectFilter: null,
      formLoading: false,
      editorInstance: null,
      destroyTableResize: null,
      destroyAlignmentInherit: null,
      destroyTableAlign: null,
      rules: {
        gradeLevel: [{ required: true, message: '请选择年级', trigger: 'change' }],
        subjectId: [{ required: true, message: '请选择学科', trigger: 'change' }],
        title: [{ required: true, message: '请输入题干', trigger: 'blur' }],
        analyze: [{ required: true, message: '请输入解析', trigger: 'blur' }]
      },
      gapEditorConfig: GAP_EDITOR_CONFIG,
      customTableDialog: {
        visible: false,
        cols: 4,
        rows: 4,
        withHeader: true
      }
    }
  },
  beforeDestroy () {
    if (this.destroyTableResize) {
      this.destroyTableResize()
      this.destroyTableResize = null
    }
    if (this.destroyAlignmentInherit) {
      this.destroyAlignmentInherit()
      this.destroyAlignmentInherit = null
    }
    if (this.destroyTableAlign) {
      this.destroyTableAlign()
      this.destroyTableAlign = null
    }
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
      if (!this.ensureQuestionTypePage(data, 4)) return
      this.form = {
        ...data,
        items: (data.items || []).map(item => ({
          ...item,
          score: item.score != null ? Number(item.score) : 0
        }))
      }
      this.$nextTick(() => {
        if (this.editorInstance) {
          this.editorInstance.setContent(this.form.title || '')
          normalizeGapTables(this.editorInstance.document)
        }
      })
      this.updateSubjectFilter()
      this.syncTotalScore()
    },
    onEditorReady (instance) {
      this.editorInstance = instance
      if (this.destroyTableResize) {
        this.destroyTableResize()
      }
      if (this.destroyAlignmentInherit) {
        this.destroyAlignmentInherit()
      }
      if (this.destroyTableAlign) {
        this.destroyTableAlign()
      }
      this.destroyTableResize = setupGapTableColumnResize(instance)
      this.destroyAlignmentInherit = setupGapEditorAlignmentInherit(instance)
      this.destroyTableAlign = setupGapEditorTableAlign(instance)
      instance.setContent(this.form.title || '')
      normalizeGapTables(instance.document)
      instance.addListener('contentChange', () => {
        this.syncItemsFromContent(instance.getContent())
      })
    },
    genUuid () {
      return 'g' + Date.now() + Math.random().toString(36).slice(2, 8)
    },
    getNextBlankNumber (content) {
      const spanRegex = /<span class="gapfilling-span (.*?)">(\d+)<\/span>/g
      let max = 0
      let match
      while ((match = spanRegex.exec(content)) !== null) {
        max = Math.max(max, parseInt(match[2], 10))
      }
      return max + 1
    },
    insertGap () {
      if (!this.editorInstance) return
      const content = this.editorInstance.getContent()
      const num = this.getNextBlankNumber(content)
      const uuid = this.genUuid()
      this.editorInstance.execCommand('insertHtml', `<span class="gapfilling-span ${uuid}">${num}</span>`)
      this.syncItemsFromContent(this.editorInstance.getContent())
    },
    insertTableHtml (html) {
      if (!this.editorInstance) return
      this.editorInstance.execCommand('insertHtml', html)
      this.$nextTick(() => {
        normalizeGapTables(this.editorInstance.document)
      })
    },
    handleTableTemplate (command) {
      if (command === 'custom') {
        this.customTableDialog.visible = true
        return
      }
      const templates = {
        '4x3': buildGapTableHtml(4, 3),
        '1x6': buildGapTableHtml(1, 6, { withHeader: false })
      }
      const html = templates[command]
      if (html) this.insertTableHtml(html)
    },
    insertCustomTable () {
      const { cols, rows, withHeader } = this.customTableDialog
      this.insertTableHtml(buildGapTableHtml(cols, rows, { withHeader }))
      this.customTableDialog.visible = false
    },
    syncItemsFromContent (content) {
      const spanRegex = /<span class="gapfilling-span (.*?)">(.*?)<\/span>/g
      const gapItems = content.match(spanRegex)
      if (!gapItems || !gapItems.length) {
        this.form.items = []
        this.form.title = content
        return false
      }
      const newItems = []
      gapItems.forEach(span => {
        const pairRegex = /<span class="gapfilling-span (.*?)">(.*?)<\/span>/
        pairRegex.test(span)
        const itemUuid = RegExp.$1
        const prefix = RegExp.$2
        const old = this.form.items.find(i => i.itemUuid === itemUuid || i.prefix === prefix)
        newItems.push({
          id: old ? old.id : null,
          itemUuid,
          prefix,
          content: old ? old.content : '',
          score: old ? old.score : 1
        })
      })
      this.form.items = newItems
      this.form.title = content
      this.syncTotalScore()
      return true
    },
    syncTotalScore () {
      const sum = this.form.items.reduce((total, item) => total + Number(item.score || 0), 0)
      this.form.score = Math.round(sum * 10) / 10
    },
    validateGapForm () {
      const content = this.editorInstance ? this.editorInstance.getContent() : this.form.title
      if (!this.syncItemsFromContent(content)) {
        this.$message.error('请先在题干中插入填空')
        return false
      }
      if (this.form.items.some(item => !item.content || String(item.content).trim() === '')) {
        this.$message.error('请填写所有填空的标准答案')
        return false
      }
      this.syncTotalScore()
      return true
    },
    submitForm () {
      if (this.editorInstance) {
        this.form.title = this.editorInstance.getContent()
      }
      this.syncTotalScore()
      this.$refs.form.validate((valid) => {
        if (!valid || !this.validateGapForm()) return
        this.form.topicType = this.form.questionType
        this.formLoading = true
        questionApi.edit(this.form).then(re => {
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
        questionType: 4,
        gradeLevel: null,
        subjectId: null,
        topicType: 4,
        paperName: '',
        moduleType: null,
        partNo: null,
        title: '',
        items: [],
        analyze: '',
        correct: '',
        score: 1,
        difficult: 1
      }
      if (this.editorInstance) {
        this.editorInstance.setContent('')
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
  }
}
</script>

<style scoped>
.gap-editor-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 10px;
}

.gap-title-editor {
  position: relative;
  z-index: 0;
}

.form-tip {
  color: #909399;
  font-size: 12px;
}

.gap-answer-table {
  width: 100%;
  max-width: 800px;
}

.gap-answer-table ::v-deep .gap-score-col .cell {
  overflow: visible;
  padding: 8px 10px;
}

.gap-score-input {
  width: 130px;
}

.gap-total-score {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.gap-total-tip {
  margin-left: 8px;
}

.gap-empty-tip {
  max-width: 720px;
  margin-bottom: 18px;
}

.question-item-rate {
  margin-top: 10px;
}
</style>
