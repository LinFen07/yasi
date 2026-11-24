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
        <div class="form-tip gap-group-tip">
          同一题号下的多个空：组内任意顺序、每个空各自可接受答案，整组全对才得分。打开「开启一题多空」后点「+」给该题号追加空；
          组内多出来的空可在操作列点「−」单独删除，删到该题号只剩一个空时会自动关闭「一题多空」。
        </div>
        <el-table :data="form.items" border size="small" class="gap-answer-table">
          <el-table-column label="题号" width="86" align="center">
            <template slot-scope="{ row, $index }">
              <el-tooltip v-if="!isGroupHead($index)" :content="`属于题号 ${row.displayNo} 的多空组（组内第 ${groupMemberSeq($index)} 个空）`" placement="top">
                <span class="gap-shared-no">〃{{ row.displayNo }}</span>
              </el-tooltip>
              <span v-else class="gap-display-no">{{ row.displayNo }}</span>
            </template>
          </el-table-column>
          <!-- 「开启一题多空」开关只出现在组首行：首行同样可以是组首（如 q390 的 33/34 组），故不禁用 -->
          <el-table-column label="开启一题多空" width="130" align="center">
            <template slot-scope="{ row, $index }">
              <el-switch
                v-if="isGroupHead($index)"
                v-model="row.multiGap"
                @change="val => onGroupToggle(row, $index, val)"
              />
              <el-tooltip v-else content="该空属于上一行的多空组，由组首统一开启或关闭" placement="top">
                <el-switch :value="true" disabled />
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="标准答案（支持多答案）" min-width="300">
            <template slot-scope="{ row }">
              <el-select
                v-model="row.contents"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="输入答案后按回车添加"
                style="width: 100%"
                @change="val => { row.content = val[0] || '' }"
              >
                <el-option
                  v-for="(answer, idx) in row.contents"
                  :key="idx"
                  :label="answer"
                  :value="answer"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="分值" width="150" align="center" class-name="gap-score-col">
            <template slot-scope="{ row, $index }">
              <el-input-number
                v-if="isGroupHead($index)"
                v-model="row.score"
                :precision="1"
                :step="1"
                :min="0"
                :max="100"
                controls-position="right"
                class="gap-score-input"
                @change="syncTotalScore"
              />
              <el-tooltip v-else content="与组首共享分值，整组全对才得分" placement="top">
                <span class="gap-shared-score">共享</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template slot-scope="{ row, $index }">
              <el-tooltip v-if="isGroupHead($index) && row.multiGap" content="为该题号追加一个空" placement="top">
                <el-button
                  size="mini"
                  type="primary"
                  icon="el-icon-plus"
                  circle
                  class="gap-append-btn"
                  @click="appendGroupSlot(row, $index)"
                />
              </el-tooltip>
              <el-tooltip v-if="isExtraGroupSlot($index)" :content="extraSlotRemoveTip($index)" placement="top">
                <el-button
                  size="mini"
                  type="danger"
                  icon="el-icon-minus"
                  circle
                  class="gap-remove-btn"
                  @click="removeGroupSlot(row, $index)"
                />
              </el-tooltip>
              <span v-if="!isAppendable($index) && !isExtraGroupSlot($index)" class="gap-op-placeholder">—</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="form-tip">题目总分 = 各题号组组首分值之和（自动合计）；组内其它空显示「共享」，不需要重复填分值。</div>
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
import uploadApi from '@/api/upload'
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

/** 题干里的填空锚点：itemUuid 承载判分定位，span 文本是「显示题号」（不是 prefix） */
const GAP_SPAN_REGEX = /<span[^>]*class="gapfilling-span\s+([^\s"]+)"[^>]*>(.*?)<\/span>/g

/** 前端自动插入的 and 分隔符：文本节点只由空白与 and 组成时才算分隔符，避免误删正文里的英文 and */
const AND_SEPARATOR_REGEX = /^(\s*and\s*)+$/i

function normalizeAndText (value) {
  return String(value == null ? '' : value).replace(/\u00a0/g, ' ')
}

function isAndSeparatorText (value) {
  return AND_SEPARATOR_REGEX.test(normalizeAndText(value))
}

function stripHtmlTags (html) {
  return String(html == null ? '' : html).replace(/<[^>]+>/g, '')
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
      destroyContentObserver: null,
      isLoadingContent: false,
      syncingFromTitle: false,
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
    if (this.destroyContentObserver) {
      this.destroyContentObserver.disconnect()
      this.destroyContentObserver = null
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
      const titleSpans = this.extractGapSpans(data.title)
      const loadedItems = (data.items || []).map((item, index) => {
        const titleSpan = titleSpans.find(span => span.itemUuid === item.itemUuid) || titleSpans[index] || null
        const contents = item.contents && item.contents.length ? item.contents : (item.content ? [item.content] : [''])
        const rawGroupGap = item.groupGap != null ? String(item.groupGap) : ''
        return {
          ...item,
          // prefix 是槽位号（1..N），不能拿来当显示题号
          prefix: item.prefix != null ? String(item.prefix) : String(index + 1),
          // 分组事实只认后端返回的 groupGap；缺失时防御性地按「每空各自一组」处理
          groupGap: rawGroupGap || String(index + 1),
          // 显示题号只从题干 span 文本解析
          displayNo: titleSpan ? titleSpan.displayNo : '',
          content: contents[0] || '',
          contents,
          // 非组首后端不返回 score，前端一律按「共享」渲染
          score: item.score != null && String(item.score) !== '' ? Number(item.score) : null,
          multiGap: false
        }
      })
      // 用 groupGap 还原组状态：连续同组的首行是组首，多空组的组首默认开启「一题多空」
      loadedItems.forEach((item, index) => {
        const range = this.findGroupRange(loadedItems, index)
        item.multiGap = range.start === index && range.end > range.start
      })
      this.form = {
        ...data,
        items: loadedItems
      }
      this.$nextTick(() => {
        if (!this.editorInstance) return
        this.isLoadingContent = true
        try {
          this.editorInstance.setContent(this.form.title || '')
          normalizeGapTables(this.editorInstance.document)
          // 回显后以题干 DOM 为准重建行数据，并规范 and 分隔符与组内题号
          this.syncItemsFromContent(this.form.title || '')
          this.syncTitleFromItems()
        } finally {
          setTimeout(() => {
            this.isLoadingContent = false
          }, 300)
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
      this.isLoadingContent = true
      instance.setContent(this.form.title || '')
      normalizeGapTables(instance.document)
      this.isLoadingContent = false
      instance.addListener('contentChange', () => {
        if (!this.isLoadingContent && !this.syncingFromTitle) {
          this.syncItemsFromContent(instance.getContent())
        }
      })

      // 题目数据可能比编辑器先到：编辑器就绪后补一次「以题干 DOM 为准」的重建与分隔符规范化
      if (this.form.items.length) {
        this.isLoadingContent = true
        try {
          this.syncItemsFromContent(this.form.title || '')
          this.syncTitleFromItems()
        } finally {
          setTimeout(() => {
            this.isLoadingContent = false
          }, 300)
        }
      }

      // MutationObserver 监听编辑器 DOM 变化，确保删除填空后表格行同步移除
      const editorBody = instance.document.body
      if (editorBody) {
        let syncTimer = null
        this.destroyContentObserver = new MutationObserver(() => {
          if (this.isLoadingContent || this.syncingFromTitle) return
          clearTimeout(syncTimer)
          syncTimer = setTimeout(() => {
            if (this.editorInstance && !this.syncingFromTitle) {
              this.syncItemsFromContent(this.editorInstance.getContent())
            }
          }, 100)
        })
        this.destroyContentObserver.observe(editorBody, {
          childList: true,
          subtree: true,
          characterData: true
        })
      }

      // 拦截粘贴事件，图片不走 base64
      const iframeWindow = instance.container.contentWindow
      if (iframeWindow) {
        iframeWindow.addEventListener('paste', async (e) => {
          const clipboardData = e.clipboardData || window.clipboardData
          if (!clipboardData || !clipboardData.items) return

          const items = clipboardData.items
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              e.preventDefault()
              const file = items[i].getAsFile()
              if (!file) continue

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
                  instance.execCommand('insertimage', { src: imageUrl, alt: '' })
                }
              } catch (err) {
                this.$message.error('图片上传失败')
              }
              return
            }
          }
        }, true)
      }
    },
    genUuid () {
      return 'g' + Date.now() + Math.random().toString(36).slice(2, 8)
    },
    /** 解析题干里的填空锚点（按出现顺序）：itemUuid + 显示题号 */
    extractGapSpans (content) {
      const spans = []
      GAP_SPAN_REGEX.lastIndex = 0
      let match
      while ((match = GAP_SPAN_REGEX.exec(String(content || ''))) !== null) {
        spans.push({
          itemUuid: match[1],
          displayNo: normalizeAndText(stripHtmlTags(match[2])).trim()
        })
      }
      return spans
    },
    /** 新插入的独立空取「现有最大显示题号 +1」；组内 + 增空不走这里（见 appendGroupSlot） */
    getNextBlankNumber () {
      const items = this.form.items || []
      let max = 0
      items.forEach(item => {
        const no = parseInt(item.displayNo, 10)
        if (!isNaN(no) && no > max) max = no
      })
      if (max === 0 && this.editorInstance) {
        const content = this.editorInstance.getContent()
        const spanRegex = /<span[^>]*class="gapfilling-span\s+[^\s"]+"[^>]*>\s*(\d+)/g
        let match
        while ((match = spanRegex.exec(content)) !== null) {
          max = Math.max(max, parseInt(match[1], 10))
        }
      }
      return max + 1
    },
    insertGap () {
      if (!this.editorInstance) return
      const num = this.getNextBlankNumber()
      const uuid = this.genUuid()
      this.syncingFromTitle = true
      try {
        this.editorInstance.execCommand('insertHtml', `<span class="gapfilling-span ${uuid}">${num}</span>`)
        // 普通插入只产生独立题号；这里顺手把可能被拆开的组内 and 分隔符清理掉
        this.syncItemsFromContent(this.editorInstance.getContent())
        this.syncTitleFromItems()
      } finally {
        setTimeout(() => {
          this.syncingFromTitle = false
        }, 200)
      }
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
    /**
     * 行数据的唯一来源：每次都以题干 DOM 里的 span 顺序重建 form.items。
     * 未命中 itemUuid 即视为新空（id=null、contents=['']、score=null），绝不按下标兜底复用旧行。
     */
    syncItemsFromContent (content) {
      const gapSpans = this.extractGapSpans(content)
      if (!gapSpans.length) {
        this.form.items = []
        this.form.title = content
        this.syncTotalScore()
        return false
      }
      const oldItems = this.form.items || []
      const newItems = []
      gapSpans.forEach((span, index) => {
        const itemUuid = span.itemUuid
        const displayNo = span.displayNo
        const old = oldItems.find(item => item.itemUuid === itemUuid)
        let groupGap = ''
        let multiGap = false
        if (old) {
          groupGap = old.groupGap != null ? String(old.groupGap) : ''
          multiGap = !!old.multiGap
        }
        if (!groupGap) {
          const prev = newItems[newItems.length - 1]
          if (prev && prev.displayNo === displayNo) {
            // 新增的空紧跟在同题号的空之后（表格「+」增空）：归入上一空所在的组
            groupGap = prev.groupGap
          } else {
            // 独立新空：给一个比现有组号都大的临时组号，随后由 recomputeQuestionNumbers 归一为 1..M
            groupGap = this.nextGroupGap(newItems)
          }
        }
        newItems.push({
          id: old ? old.id : null,
          itemUuid,
          // prefix 只是槽位号（1..N），与题干显示题号无关
          prefix: String(index + 1),
          groupGap,
          displayNo,
          contents: old && old.contents && old.contents.length ? old.contents : (old && old.content ? [old.content] : ['']),
          content: (old && old.content) || '',
          // 新空分值必须是 null（组首由老师自己填），否则会被误算进总分
          score: old && old.score != null ? old.score : null,
          describe: old ? old.describe : null,
          multiGap
        })
      })
      const spanSetChanged = oldItems.length !== newItems.length ||
        oldItems.some((item, index) => newItems[index].itemUuid !== item.itemUuid)
      const spanRemoved = newItems.length < oldItems.length
      this.form.items = newItems
      this.form.title = content
      // 组首被删掉时，新组首从同组旧行继承分值（必须在组号归一之前按旧组号匹配）
      if (spanRemoved) {
        this.inheritGroupHeadScore(oldItems)
      }
      this.recomputeQuestionNumbers()
      // 空被删掉后按「组内实际空数」校正开关：某题号只剩 1 个空时自动关闭「一题多空」
      if (spanRemoved) {
        this.normalizeMultiGapFlags()
      }
      this.syncTotalScore()
      // 老师在题干里手工增删 span（删空/粘贴）时，顺带清掉残留的 and 分隔符；
      // 组内增删走 appendGroupSlot/removeGroupExtraSlots，已由 syncingFromTitle 守卫，不在这里重复处理
      if (spanSetChanged && this.editorInstance && !this.isLoadingContent && !this.syncingFromTitle) {
        this.syncingFromTitle = true
        try {
          this.handleAndSeparators()
          this.form.title = this.editorInstance.getContent()
        } finally {
          setTimeout(() => {
            this.syncingFromTitle = false
          }, 200)
        }
      }
      return true
    },
    nextGroupGap (items) {
      const list = items || []
      let max = 0
      list.forEach(item => {
        const value = parseInt(item.groupGap, 10)
        if (!isNaN(value) && value > max) max = value
      })
      return String(max + 1)
    },
    /** 连续相同 groupGap 的若干行属于同一个题号组 */
    findGroupRange (items, index) {
      const list = items || this.form.items || []
      if (!list.length || index == null || index < 0 || index >= list.length) {
        return { start: -1, end: -1 }
      }
      const gap = String(list[index].groupGap)
      let start = index
      while (start > 0 && String(list[start - 1].groupGap) === gap) start--
      let end = index
      while (end < list.length - 1 && String(list[end + 1].groupGap) === gap) end++
      return { start, end }
    },
    isGroupHead (index) {
      const items = this.form.items || []
      if (index == null || index < 0 || index >= items.length) return false
      if (index === 0) return true
      return String(items[index].groupGap) !== String(items[index - 1].groupGap)
    },
    groupMemberSeq (index) {
      const range = this.findGroupRange(this.form.items, index)
      return range.start < 0 ? 1 : index - range.start + 1
    },
    /** 组首且已开启「一题多空」时，操作列出现「+」增空按钮 */
    isAppendable (index) {
      const items = this.form.items || []
      if (!this.isGroupHead(index)) return false
      return !!items[index].multiGap
    },
    /** 组内除组首以外的空（多出来的空）：操作列出现「−」删除按钮 */
    isExtraGroupSlot (index) {
      const items = this.form.items || []
      if (index == null || index < 0 || index >= items.length) return false
      const range = this.findGroupRange(items, index)
      return range.start >= 0 && range.end > range.start && index !== range.start
    },
    extraSlotRemoveTip (index) {
      const range = this.findGroupRange(this.form.items, index)
      const remain = range.start < 0 ? 0 : range.end - range.start
      return remain <= 1
        ? '删除这个多出来的空（该题号将只剩 1 个空，会自动关闭「一题多空」）'
        : `删除这个多出来的空（该题号还剩 ${remain} 个空）`
    },
    /** 只重排 groupGap 与 displayNo；displayNo 来自题干 span 文本，绝不把 prefix 写进 span */
    recomputeQuestionNumbers () {
      const items = this.form.items
      if (!items.length) return
      // 先记下「组边界」判据（连续相同为同组），再归一为 1..M
      const oldGaps = items.map(item => (item.groupGap == null ? '' : String(item.groupGap)))
      let groupNo = 0
      let groupDisplayNo = 0
      items.forEach((item, index) => {
        const isNewGroup = index === 0 || oldGaps[index] !== oldGaps[index - 1]
        if (isNewGroup) {
          groupNo += 1
          const parsedNo = parseInt(item.displayNo, 10)
          // 解析不到（题干 span 未写数字）时退回「上一题号 +1」，仍然不碰 prefix
          groupDisplayNo = isNaN(parsedNo) ? groupDisplayNo + 1 : parsedNo
        }
        item.displayNo = String(groupDisplayNo)
        item.groupGap = String(groupNo)
      })
    },
    /** 把 displayNo 回写到题干 span，并按 groupGap 补齐/清理 and 分隔符 */
    syncTitleFromItems () {
      if (!this.editorInstance) return
      const items = this.form.items
      this.syncingFromTitle = true
      try {
        items.forEach(item => {
          const span = this.findEditorSpan(item.itemUuid)
          if (span && item.displayNo) span.textContent = item.displayNo
        })
        this.handleAndSeparators()
        this.form.title = this.editorInstance.getContent()
      } finally {
        // 延迟清除标志位，避开 MutationObserver 的 100ms 防抖窗口
        setTimeout(() => {
          this.syncingFromTitle = false
        }, 200)
      }
    },
    /** 相邻两个 span：同组则保证中间有且只有一个 and 分隔符，不同组则清掉多余分隔符（幂等） */
    handleAndSeparators () {
      if (!this.editorInstance) return
      const doc = this.editorInstance.document
      const spans = doc.querySelectorAll('.gapfilling-span')
      if (spans.length < 2) return
      const items = this.form.items
      for (let i = 0; i < spans.length - 1; i++) {
        const current = spans[i]
        const next = spans[i + 1]
        if (!current.parentNode || !next.parentNode) continue
        const currentItem = this.findItemBySpan(current, items)
        const nextItem = this.findItemBySpan(next, items)
        const sameGroup = !!(currentItem && nextItem && String(currentItem.groupGap) === String(nextItem.groupGap))
        // 先清理两个空之间已有的 and 分隔符（可能因 <br>/元素节点残留或被重复插入）
        this.cleanAndSeparators(current, next)
        if (sameGroup) {
          next.parentNode.insertBefore(doc.createTextNode(' and '), next)
        }
      }
    },
    cleanAndSeparators (current, next) {
      let node = current.nextSibling
      while (node && node !== next) {
        const nextNode = node.nextSibling
        if (node.nodeType === 3 && node.parentNode && isAndSeparatorText(node.nodeValue)) {
          node.parentNode.removeChild(node)
        }
        node = nextNode
      }
    },
    findItemBySpan (span, items) {
      const className = (span && span.className) || ''
      return (items || []).find(item => item.itemUuid && className.indexOf(item.itemUuid) !== -1) || null
    },
    findEditorSpan (itemUuid) {
      if (!this.editorInstance || !itemUuid) return null
      const spans = this.editorInstance.document.querySelectorAll('.gapfilling-span')
      for (let i = 0; i < spans.length; i++) {
        if ((spans[i].className || '').indexOf(itemUuid) !== -1) return spans[i]
      }
      return null
    },
    /** 开关「一题多空」：打开只标记组首（行尾出现 +）；关闭会删除该组多出来的空（含答案与题干 span） */
    onGroupToggle (row, index, val) {
      if (!row || index < 0) return
      const range = this.findGroupRange(this.form.items, index)
      if (range.start !== index) {
        // 组内非组首的空不能单独开关，统一由组首管理
        row.multiGap = false
        return
      }
      if (val) {
        row.multiGap = true
        return
      }
      const extraCount = range.end - range.start
      if (!extraCount) {
        row.multiGap = false
        this.syncTotalScore()
        return
      }
      this.$confirm(
        `关闭「一题多空」会删除该组多出来的 ${extraCount} 个空（含已填答案与题干中的空），且不可恢复，是否继续？`,
        '关闭一题多空',
        {
          type: 'warning',
          confirmButtonText: '删除并关闭',
          cancelButtonText: '取消'
        }
      ).then(() => {
        this.removeGroupExtraSlots(index)
      }).catch(() => {
        row.multiGap = true
      })
    },
    /** 删除组内除组首以外的空：题干 span + 相邻 and 分隔符，然后由 syncItemsFromContent 单向重建行数据 */
    removeGroupExtraSlots (headIndex) {
      if (!this.editorInstance) return
      const items = this.form.items
      const range = this.findGroupRange(items, headIndex)
      if (range.start !== headIndex || range.end <= range.start) return
      const headItem = items[range.start]
      const extraItems = items.slice(range.start + 1, range.end + 1)
      this.syncingFromTitle = true
      try {
        extraItems.forEach(item => {
          const span = this.findEditorSpan(item.itemUuid)
          if (!span || !span.parentNode) return
          this.removeAdjacentAndSeparator(span)
          span.parentNode.removeChild(span)
        })
        this.syncItemsFromContent(this.editorInstance.getContent())
        const rebuiltHead = this.form.items.find(item => item.itemUuid === headItem.itemUuid)
        if (rebuiltHead) rebuiltHead.multiGap = false
        this.syncTitleFromItems()
        this.syncTotalScore()
        this.$message.success(`已删除该组多出来的 ${extraItems.length} 个空`)
      } finally {
        setTimeout(() => {
          this.syncingFromTitle = false
        }, 200)
      }
    },
    removeAdjacentAndSeparator (span) {
      const parent = span.parentNode
      if (!parent) return
      const isSeparatorNode = node => !!node && node.nodeType === 3 && isAndSeparatorText(node.nodeValue)
      if (isSeparatorNode(span.previousSibling)) {
        parent.removeChild(span.previousSibling)
      } else if (isSeparatorNode(span.nextSibling)) {
        parent.removeChild(span.nextSibling)
      }
    },
    /**
     * 删除组内某个多出来的空（操作列「−」）：删题干 span + 相邻 and 分隔符，
     * 行数据仍只由题干单向推导；删到该题号只剩 1 个空时自动关闭「一题多空」。
     */
    removeGroupSlot (row, index) {
      if (!this.editorInstance) return
      const items = this.form.items || []
      const range = this.findGroupRange(items, index)
      if (range.start < 0 || range.end <= range.start || index === range.start) return
      const target = items[index]
      if (!target) return
      const span = this.findEditorSpan(target.itemUuid)
      if (!span || !span.parentNode) {
        this.$message.error('未在题干中找到该空的锚点，请直接在题干里删除这个空')
        return
      }
      const headDisplayNo = items[range.start].displayNo || ''
      const sizeBefore = range.end - range.start + 1
      this.syncingFromTitle = true
      try {
        this.removeAdjacentAndSeparator(span)
        span.parentNode.removeChild(span)
        // 不手工 splice：重建与开关校正都在 syncItemsFromContent 内完成
        this.syncItemsFromContent(this.editorInstance.getContent())
        this.syncTitleFromItems()
        this.syncTotalScore()
        if (sizeBefore - 1 <= 1) {
          this.$message.success(`已删除该空；题号 ${headDisplayNo} 只剩一个空，已自动关闭「一题多空」`)
        } else {
          this.$message.success(`已删除该空；题号 ${headDisplayNo} 还剩 ${sizeBefore - 1} 个空`)
        }
      } finally {
        setTimeout(() => {
          this.syncingFromTitle = false
        }, 200)
      }
    },
    /**
     * 按「组内实际空数」校正每组的「一题多空」开关：
     * 组内 ≥2 个空 → 组首开关保持开启（+ 可用）；组内只剩 1 个空 → 自动关闭。
     */
    normalizeMultiGapFlags () {
      const items = this.form.items || []
      items.forEach((item, index) => {
        if (!this.isGroupHead(index)) {
          item.multiGap = false
          return
        }
        const range = this.findGroupRange(items, index)
        item.multiGap = range.end > range.start
      })
    },
    /**
     * 组首行被删掉（题干里手工删 span）时，新组首从同组旧行继承分值，
     * 避免老师被迫重新填分、也不让总分莫名变小。用旧 groupGap 匹配，必须在组号归一之前调用。
     */
    inheritGroupHeadScore (oldItems) {
      const items = this.form.items || []
      const legacyItems = oldItems || []
      items.forEach((item, index) => {
        if (!this.isGroupHead(index) || item.score != null) return
        const legacy = legacyItems.find(old => old.groupGap === item.groupGap && old.score != null)
        if (legacy) item.score = legacy.score
      })
    },
    /** 「+」增空：在组内最后一个 span 后面 DOM 直插新 span（文本 = 组首显示题号，前面补 and） */
    appendGroupSlot (row, index) {
      if (!this.editorInstance) return
      const items = this.form.items
      const range = this.findGroupRange(items, index)
      if (range.start < 0) return
      const head = items[range.start]
      const last = items[range.end]
      const lastSpan = this.findEditorSpan(last.itemUuid)
      if (!lastSpan || !lastSpan.parentNode) {
        this.$message.error('未在题干中找到该空的锚点，请检查题干')
        return
      }
      const doc = this.editorInstance.document
      const uuid = this.genUuid()
      // 新空显示题号 = 组首显示题号（不是 getNextBlankNumber 的「最大号 +1」）
      const displayNo = head.displayNo || ''
      this.syncingFromTitle = true
      try {
        const span = doc.createElement('span')
        span.className = `gapfilling-span ${uuid}`
        span.textContent = displayNo
        const separator = doc.createTextNode(' and ')
        const insertPoint = lastSpan.nextSibling
        lastSpan.parentNode.insertBefore(separator, insertPoint)
        lastSpan.parentNode.insertBefore(span, separator.nextSibling)
        // 行数据只由题干推导：新 span 的 itemUuid 未命中旧行 → 新空（答案空、分值为 null）
        this.syncItemsFromContent(this.editorInstance.getContent())
        this.syncTitleFromItems()
        this.syncTotalScore()
      } finally {
        setTimeout(() => {
          this.syncingFromTitle = false
        }, 200)
      }
    },
    /** 总分只累加组首分值，组内其它空共享组首分值 */
    syncTotalScore () {
      const items = this.form.items || []
      const sum = items.reduce((total, item, index) => {
        if (!this.isGroupHead(index)) return total
        return total + Number(item.score || 0)
      }, 0)
      this.form.score = Math.round(sum * 10) / 10
    },
    validateGapForm () {
      const content = this.editorInstance ? this.editorInstance.getContent() : this.form.title
      if (!this.syncItemsFromContent(content)) {
        this.$message.error('请先在题干中插入填空')
        return false
      }
      // 每个空都必须自己填答案（同义词/多解放在同一空的答案集合里）
      if (this.form.items.some(item => !item.contents || !item.contents.length || !String(item.contents[0] || '').trim())) {
        this.$message.error('请填写所有填空的标准答案（每个空至少 1 个答案）')
        return false
      }
      // 组首分值必填且必须大于 0
      const missingScoreIndex = this.form.items.findIndex((item, index) => this.isGroupHead(index) && !(Number(item.score) > 0))
      if (missingScoreIndex !== -1) {
        const row = this.form.items[missingScoreIndex]
        this.$message.error(`请填写题号 ${row.displayNo || missingScoreIndex + 1} 的分值（每组组首分值必须大于 0）`)
        return false
      }
      // 同一组内两个空的可接受集合完全相同且元素数 > 1 时后端会拒绝
      const duplicateNo = this.findDuplicateAnswerSetInGroup()
      if (duplicateNo) {
        this.$message.error(`题号 ${duplicateNo} 同一组内有两个空的答案集合完全相同，请调整后再保存`)
        return false
      }
      this.syncTotalScore()
      const headSum = this.form.items.reduce((total, item, index) => {
        if (!this.isGroupHead(index)) return total
        return total + Number(item.score || 0)
      }, 0)
      if (Math.abs(headSum - Number(this.form.score || 0)) > 0.001) {
        this.$message.error('题目总分与各组组首分值之和不一致，请检查分值')
        return false
      }
      return true
    },
    findDuplicateAnswerSetInGroup () {
      const items = this.form.items || []
      for (let headIndex = 0; headIndex < items.length; headIndex++) {
        if (!this.isGroupHead(headIndex)) continue
        const range = this.findGroupRange(items, headIndex)
        if (range.end <= range.start) continue
        const seen = []
        for (let i = range.start; i <= range.end; i++) {
          const contents = (items[i].contents || [])
            .map(value => String(value == null ? '' : value).trim().toLowerCase())
            .filter(value => value)
          if (contents.length <= 1) continue
          const key = contents.slice().sort().join('\u0001')
          if (seen.indexOf(key) !== -1) return items[i].displayNo || String(headIndex + 1)
          seen.push(key)
        }
      }
      return null
    },
    submitForm () {
      if (this.editorInstance) {
        this.form.title = this.editorInstance.getContent()
      }
      this.syncItemsFromContent(this.form.title)
      this.$refs.form.validate((valid) => {
        if (!valid || !this.validateGapForm()) return
        const items = this.form.items.map((item, index) => {
          const contents = (item.contents || [])
            .map(value => String(value == null ? '' : value).trim())
            .filter(value => value)
          const content = contents.length ? contents[0] : (item.content || '')
          return {
            id: item.id,
            itemUuid: item.itemUuid,
            // prefix = 槽位号 1..N（唯一），与题干显示题号解耦
            prefix: String(index + 1),
            // 每个空都必须带组号；同一题号组的空 groupGap 相同且必须相邻
            groupGap: String(item.groupGap),
            contents: contents.length ? contents : [content],
            content,
            // 只有组首带分值（字符串分制），非组首必须为 null（不是 0）
            score: this.isGroupHead(index) ? String(Number(item.score)) : null,
            describe: item.describe || null
          }
        })
        const payload = {
          ...this.form,
          items,
          score: String(this.form.score),
          topicType: this.form.questionType
        }
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

.gap-group-tip {
  line-height: 1.6;
  margin-bottom: 8px;
}

.gap-answer-table {
  width: 100%;
  max-width: 900px;
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

.gap-display-no {
  font-weight: 600;
  color: #303133;
}

.gap-shared-no {
  color: #909399;
  font-style: italic;
  font-size: 13px;
}

.gap-shared-score {
  color: #909399;
  font-size: 12px;
}

.gap-op-placeholder {
  color: #c0c4cc;
  font-size: 12px;
}

.gap-append-btn {
  padding: 0;
  width: 26px;
  height: 26px;
}

.gap-remove-btn {
  padding: 0;
  width: 26px;
  height: 26px;
  margin-left: 6px;
}

.question-item-rate {
  margin-top: 10px;
}
</style>
