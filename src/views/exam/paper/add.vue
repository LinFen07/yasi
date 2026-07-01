<template>
  <div class="paper-edit-page">
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="100px"
      v-loading="formLoading"
      class="paper-form"
    >
      <!-- 基本信息 -->
      <div class="form-card">
        <div class="form-card__header">
          <span class="form-card__dot" />
          <h3 class="form-card__title">基本信息</h3>
          <span class="form-card__hint">带 <em>*</em> 为必填项</span>
        </div>
        <div class="form-card__body">
          <el-row :gutter="24">
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="年级" prop="level" required>
                <el-select v-model="form.level" placeholder="请选择年级" style="width: 100%" @change="levelChange">
                  <el-option v-for="item in levelEnum" :key="item.key" :value="item.key" :label="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="学科" prop="subjectId" required>
                <el-select
                  v-model="form.subjectId"
                  placeholder="请选择学科"
                  clearable
                  style="width: 100%"
                  @change="subjectChange"
                >
                  <el-option
                    v-for="item in subjectFilter"
                    :key="item.id"
                    :value="item.id"
                    :label="item.name + ' ( ' + item.levelName + ' )'"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="试卷类型" prop="paperType" required>
                <el-select v-model="form.paperType" placeholder="请选择试卷类型" style="width: 100%">
                  <el-option v-for="item in paperTypeEnum" :key="item.key" :value="item.key" :label="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-show="form.paperType === 4" :xs="24" :sm="24" :lg="16">
              <el-form-item label="时间限制" required>
                <el-date-picker
                  v-model="form.limitDateTime"
                  value-format="yyyy-MM-dd HH:mm:ss"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="form.paperType === 4 ? 8 : 12">
              <el-form-item label="试卷名称" prop="name" required>
                <el-input v-model="form.name" placeholder="请输入试卷名称" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="form.paperType === 4 ? 8 : 12">
              <el-form-item label="建议时长" prop="suggestTime" required>
                <el-input v-model="form.suggestTime" placeholder="请输入时长" clearable>
                  <template slot="append">分钟</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 雅思三模块 -->
      <div class="form-card">
        <div class="form-card__header">
          <span class="form-card__dot form-card__dot--cyan" />
          <h3 class="form-card__title">试卷模块</h3>
          <span class="form-card__count">听力 · 阅读 · 写作</span>
        </div>
        <div class="form-card__body">
          <div class="module-overview">
            <div
              v-for="(section, index) in ieltsSections"
              :key="section.key"
              class="module-card"
              :class="'module-card--' + section.theme"
              @click="activeSectionTab = String(index)"
            >
              <div class="module-card__icon">
                <svg-icon :icon-class="section.icon" />
              </div>
              <div class="module-card__info">
                <div class="module-card__label">{{ section.label }}</div>
                <div class="module-card__en">{{ section.enLabel }}</div>
              </div>
              <div class="module-card__stat">
                <strong v-if="section.theme === 'listening' || section.theme === 'reading'">
                  {{ getSectionQuestionCount(index) }}<small class="module-card__total">/40</small>
                </strong>
                <strong v-else-if="section.theme === 'writing'">
                  {{ getSectionQuestionCount(index) }}<small class="module-card__total">/2</small>
                </strong>
                <strong v-else>{{ getSectionQuestionCount(index) }}</strong>
                <span>题</span>
              </div>
            </div>
          </div>

          <el-tabs v-model="activeSectionTab" class="module-tabs">
            <el-tab-pane
              v-for="(section, index) in ieltsSections"
              :key="section.key"
              :name="String(index)"
            >
              <span slot="label" class="module-tab-label">
                <svg-icon :icon-class="section.icon" />
                {{ section.label }}
                <em v-if="(section.theme === 'listening' || section.theme === 'reading') && getSectionQuestionCount(index)">{{ getSectionQuestionCount(index) }}/40</em>
                <em v-else-if="section.theme === 'writing' && getSectionQuestionCount(index)">{{ getSectionQuestionCount(index) }}/2</em>
                <em v-else-if="getSectionQuestionCount(index)">{{ getSectionQuestionCount(index) }}</em>
              </span>

              <template v-if="form.titleItems[index]">
              <ListeningSection
                v-if="section.theme === 'listening' && activeSectionTab === String(index)"
                :module="form.titleItems[index]"
                :section="section"
                :section-index="index"
                :active-part-tab="activeSubsectionTab"
                :toolbar-config="toolbarConfig"
                :editor-config="editorConfig"
                @update:activePartTab="activeSubsectionTab = $event"
                @add-question="addQuestion"
                @editor-created="handleEditorCreated"
              />

              <ReadingSection
                v-else-if="section.theme === 'reading' && activeSectionTab === String(index)"
                :module="form.titleItems[index]"
                :section="section"
                :section-index="index"
                :active-part-tab="activeSubsectionTab"
                @update:activePartTab="activeSubsectionTab = $event"
                @add-question="addQuestion"
              />

              <WritingSection
                v-else-if="section.theme === 'writing' && activeSectionTab === String(index)"
                :module="form.titleItems[index]"
                :section="section"
                :section-index="index"
                :active-part-tab="activeSubsectionTab"
                @update:activePartTab="activeSubsectionTab = $event"
                @add-question="addQuestion"
              />
              </template>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <div class="form-actions">
        <el-button type="primary" icon="el-icon-check" :loading="formLoading" @click="submitForm">保存</el-button>
        <el-button icon="el-icon-refresh-left" @click="resetForm">重置</el-button>
        <span class="form-actions__tip">可先保存已填写的模块，后续再继续补充阅读、写作等内容</span>
      </div>
    </el-form>

    <el-dialog
      :visible.sync="questionPage.showDialog"
      width="72%"
      custom-class="question-select-dialog"
      :title="questionDialogTitle"
    >
      <el-form :model="questionPage.queryParam" ref="queryForm" :inline="true" class="question-search-form">
        <el-form-item label="题干">
          <el-input v-model="questionPage.queryParam.content" clearable placeholder="请输入题干关键词" />
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="questionPage.queryParam.questionType" clearable placeholder="全部题型">
            <el-option v-for="item in questionTypeEnum" :key="item.key" :value="item.key" :label="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="试卷名称">
          <el-input v-model="questionPage.queryParam.paperName" clearable placeholder="建议填写，便于筛选" />
        </el-form-item>
        <el-form-item label="所属模块">
          <el-select v-model="questionPage.queryParam.moduleType" clearable placeholder="全部">
            <el-option v-for="item in moduleTypeEnum" :key="item.key" :value="item.key" :label="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Part">
          <el-input
            v-model.number="questionPage.queryParam.partNo"
            clearable
            placeholder="如 1"
            style="width: 100px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="queryForm">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table
        v-loading="questionPage.listLoading"
        :data="questionPage.tableData"
        class="question-select-table"
        @selection-change="handleSelectionChange"
        border
        fit
        highlight-current-row
        style="width: 100%"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="序号" width="70" align="center">
          <template slot-scope="scope">
            {{ (questionPage.queryParam.pageIndex - 1) * questionPage.queryParam.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="questionType" label="题型" :formatter="questionTypeFormatter" width="90" />
        <el-table-column prop="paperName" label="试卷名称" show-overflow-tooltip width="140" />
        <el-table-column prop="partNo" label="Part" width="70" align="center" :formatter="partNoFormatter" />
        <el-table-column prop="moduleType" label="所属模块" :formatter="moduleTypeFormatter" width="90" />
        <el-table-column prop="shortTitle" label="题干" show-overflow-tooltip />
      </el-table>
      <pagination
        v-show="questionPage.total > 0"
        :total="questionPage.total"
        :page.sync="questionPage.queryParam.pageIndex"
        :limit.sync="questionPage.queryParam.pageSize"
        @pagination="search"
      />
      <span slot="footer" class="dialog-footer">
        <el-button @click="questionPage.showDialog = false">取 消</el-button>
        <el-button type="primary" @click="confirmQuestionSelect">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>

import { mapGetters, mapState, mapActions } from 'vuex'
import Pagination from '@/components/Pagination'
import examPaperApi from '@/api/examPaper'
import questionApi from '@/api/question'
import uploadApi from '@/api/upload'
import {
  IELTS_SECTIONS,
  initModuleTitleItems,
  groupTitleItemsForEdit,
  flattenModuleTitleItemsForSave,
  validatePaperModulesForSave,
  normalizePaperQuestionItem,
  getModuleQuestionCount,
  destroyModuleEditors,
  normalizeListeningModule,
  normalizeReadingModule,
  normalizeWritingModule,
  getSubsectionQuestionCount,
  WRITING_PART_SIZE
} from './paperModule'
import { DEFAULT_GRADE_LEVEL, findDefaultSubject } from '../question/mixins/questionEditPage'

export default {
  name: 'ExamPaperAdd',
  components: {
    Pagination
  },
  data () {
    return {
      form: {
        id: null,
        level: null,
        subjectId: null,
        paperType: 1,
        limitDateTime: [],
        name: '',
        suggestTime: null,
        titleItems: initModuleTitleItems()
      },
      subjectFilter: [],
      formLoading: false,
      rules: {
        level: [
          { required: true, message: '请选择年级', trigger: 'change' }
        ],
        subjectId: [
          { required: true, message: '请选择学科', trigger: 'change' }
        ],
        paperType: [
          { required: true, message: '请选择试卷类型', trigger: 'change' }
        ],
        name: [
          { required: true, message: '请输入试卷名称', trigger: 'blur' }
        ],
        suggestTime: [
          { required: true, message: '请输入建议时长', trigger: 'blur' }
        ]
      },
      questionPage: {
        multipleSelection: [],
        showDialog: false,
        queryParam: {
          content: null,
          questionType: null,
          paperName: null,
          moduleType: null,
          partNo: null,
          pageIndex: 1,
          pageSize: 10
        },
        listLoading: true,
        tableData: [],
        total: 0
      },
      currentTitleItem: null,
      toolbarConfig: {
        excludeKeys: [
          'headerSelect',
          'italic',
          'group-more-style'
        ]
      },
      editorConfig: {
        placeholder: '请输入模块说明，支持图文混排...',
        MENU_CONF: {}
      },
      ieltsSections: IELTS_SECTIONS,
      activeSectionTab: '0',
      activeSubsectionTab: '0',
      currentSectionIndex: 0
    }
  },
  computed: {
    ...mapGetters('enumItem', ['enumFormat']),
    ...mapState('enumItem', {
      questionTypeEnum: state => state.exam.question.typeEnum,
      paperTypeEnum: state => state.exam.examPaper.paperTypeEnum,
      moduleTypeEnum: state => state.exam.examPaper.moduleTypeEnum,
      levelEnum: state => state.user.levelEnum
    }),
    ...mapState('exam', { subjects: state => state.subjects }),
    questionDialogTitle () {
      const section = this.ieltsSections[this.currentSectionIndex]
      if (!section) return '选择题目'
      const partNum = parseInt(this.activeSubsectionTab, 10) + 1
      if (section.theme === 'listening') {
        return `选择听力 Part ${partNum} 题目`
      }
      if (section.theme === 'reading') {
        return `选择阅读 Passage ${partNum} 题目`
      }
      if (section.theme === 'writing') {
        return `选择写作 Task ${partNum} 作文题`
      }
      return `选择${section.label}题目`
    }
  },
  watch: {
    activeSectionTab () {
      this.activeSubsectionTab = '0'
      destroyModuleEditors(this.form.titleItems)
    },
    activeSubsectionTab () {
      destroyModuleEditors(this.form.titleItems)
    }
  },
  created () {
    this.editorConfig.MENU_CONF.uploadImage = {
      customUpload: (file, insertFn) => this.uploadEditorImage(file, insertFn)
    }
    let _this = this
    this.initSubject(() => {
      _this.applyDefaultGradeSubject()
    })
    this.form.titleItems = initModuleTitleItems()
  },
  activated () {
    this.ensurePaperModules()
  },
  beforeDestroy () {
    destroyModuleEditors(this.form.titleItems)
  },
  methods: {
    ensurePaperModules () {
      if (!this.form.titleItems || this.form.titleItems.length === 0) {
        this.form.titleItems = initModuleTitleItems()
        return
      }
      if (this.form.titleItems[0]) {
        this.$set(this.form.titleItems, 0, normalizeListeningModule(this.form.titleItems[0]))
      }
      if (this.form.titleItems[1]) {
        this.$set(this.form.titleItems, 1, normalizeReadingModule(this.form.titleItems[1]))
      }
      if (this.form.titleItems[2]) {
        this.$set(this.form.titleItems, 2, normalizeWritingModule(this.form.titleItems[2]))
      }
    },
    async uploadEditorImage (file, insertFn) {
      if (!file) return
      if (file.size > uploadApi.MAX_IMAGE_SIZE) {
        this.$message.error('图片大小不能超过3M')
        return
      }
      const loading = this.$loading({
        lock: true,
        text: '图片上传中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      try {
        const res = await uploadApi.upload(file)
        const imageUrl = uploadApi.getImageUrl(res)
        if (imageUrl) {
          insertFn(imageUrl, file.name, imageUrl)
          this.$message.success('图片上传成功')
        } else {
          this.$message.error(res.message || '图片上传失败')
        }
      } catch (error) {
        console.error('图片上传失败:', error)
        this.$message.error(error.message || '图片上传失败')
      } finally {
        loading.close()
      }
    },
    submitForm () {
      const moduleErrors = validatePaperModulesForSave(this.form.titleItems)
      if (moduleErrors.length > 0) {
        this.$message.warning(moduleErrors[0].message)
        return
      }
      this.$refs.form.validate((valid) => {
        if (!valid) return
        this.formLoading = true
        const payload = Object.assign({}, this.form, {
          titleItems: flattenModuleTitleItemsForSave(this.form.titleItems)
        })
        examPaperApi.edit(payload).then(re => {
          if (re.code === 1) {
            const saved = re.response
            this.$message.success('保存成功，可继续编辑其他模块')
            if (saved && saved.id) {
              this.form.id = saved.id
              if (saved.titleItems) {
                this.form.titleItems = groupTitleItemsForEdit(saved.titleItems)
                this.ensurePaperModules()
              }
              if (!this.$route.query.id) {
                this.$router.replace({ path: '/exam/paper/edit', query: { id: saved.id } })
              }
            }
            this.formLoading = false
          } else {
            this.$message.error(re.message)
            this.formLoading = false
          }
        }).catch(() => {
          this.formLoading = false
        })
      })
    },
    addQuestion (subsection, sectionIndex) {
      const section = this.ieltsSections[sectionIndex]
      if (section && section.theme === 'writing' && getSubsectionQuestionCount(subsection) >= WRITING_PART_SIZE) {
        this.$message.warning('每个写作 Task 只能添加 1 道作文题')
        return
      }
      this.currentTitleItem = subsection
      this.currentSectionIndex = sectionIndex
      this.questionPage.queryParam = {
        content: null,
        questionType: section ? section.suggestQuestionType : null,
        paperName: this.form.name || null,
        moduleType: section ? section.key : null,
        partNo: parseInt(this.activeSubsectionTab, 10) + 1,
        pageIndex: 1,
        pageSize: 10
      }
      this.questionPage.multipleSelection = []
      this.questionPage.showDialog = true
      this.search()
    },
    getSectionQuestionCount (index) {
      return getModuleQuestionCount(this.form.titleItems[index])
    },
    queryForm () {
      this.questionPage.queryParam.pageIndex = 1
      this.search()
    },
    confirmQuestionSelect () {
      let _this = this
      this.questionPage.multipleSelection.forEach(q => {
        questionApi.select(q.id).then(re => {
          _this.currentTitleItem.questionItems.push(normalizePaperQuestionItem(re.response))
        })
      })
      this.questionPage.showDialog = false
    },
    levelChange () {
      this.form.subjectId = null
      this.updateSubjectFilter()
    },
    applyDefaultGradeSubject () {
      const defaultSubject = findDefaultSubject(this.subjects)
      if (defaultSubject) {
        this.form.level = Number(defaultSubject.level)
        this.form.subjectId = defaultSubject.id
      } else {
        this.form.level = DEFAULT_GRADE_LEVEL
        this.form.subjectId = null
      }
      this.updateSubjectFilter()
    },
    subjectChange (subjectId) {
      if (!subjectId) return
      const subject = (this.subjects || []).find(item => Number(item.id) === Number(subjectId))
      if (subject && subject.level != null) {
        this.form.level = Number(subject.level)
      }
    },
    updateSubjectFilter () {
      this.subjectFilter = [...(this.subjects || [])]
    },
    search () {
      this.questionPage.listLoading = true
      const { content, questionType, paperName, moduleType, partNo, pageIndex, pageSize } = this.questionPage.queryParam
      const params = {
        content: content || null,
        questionType: questionType || null,
        paperName: paperName || null,
        moduleType: moduleType || null,
        partNo: partNo != null && partNo !== '' ? Number(partNo) : null,
        subjectId: this.form.subjectId || null,
        pageIndex,
        pageSize
      }
      questionApi.pageList(params).then(data => {
        const re = data.response
        this.questionPage.tableData = re.list
        this.questionPage.total = re.total
        this.questionPage.queryParam.pageIndex = re.pageNum
        this.questionPage.listLoading = false
      })
    },
    handleSelectionChange (val) {
      this.questionPage.multipleSelection = val
    },
    questionTypeFormatter (row, column, cellValue, index) {
      return this.enumFormat(this.questionTypeEnum, cellValue)
    },
    moduleTypeFormatter (row, column, cellValue, index) {
      return this.enumFormat(this.moduleTypeEnum, cellValue)
    },
    partNoFormatter (row, column, cellValue) {
      return cellValue != null && cellValue !== '' ? cellValue : '-'
    },
    resetForm () {
      this.$refs['form'].resetFields()
      this.form = {
        id: null,
        level: null,
        subjectId: null,
        paperType: 1,
        limitDateTime: [],
        name: '',
        suggestTime: null,
        titleItems: []
      }
      this.form.titleItems = initModuleTitleItems()
      this.ensurePaperModules()
      this.activeSectionTab = '0'
      this.activeSubsectionTab = '0'
      this.applyDefaultGradeSubject()
    },
    handleEditorCreated (editor, subsection) {
      this.$set(subsection, 'editor', editor)
    },
    ...mapActions('exam', { initSubject: 'initSubject' }),
    ...mapActions('tagsView', { delCurrentView: 'delCurrentView' })
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.paper-edit-page {
  min-height: calc(100vh - 84px);
  padding: 20px 24px 32px;
  background: #f5f7fb;
}

.form-card {
  margin-bottom: 20px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 24px;
    border-bottom: 1px solid #f0f2f5;

    &--split {
      justify-content: space-between;
    }
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $primaryGradient;
    flex-shrink: 0;

    &--cyan {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  &__hint {
    margin-left: auto;
    font-size: 12px;
    color: #909399;

    em {
      color: #f56c6c;
      font-style: normal;
    }
  }

  &__count {
    font-size: 12px;
    color: #909399;
    padding: 2px 10px;
    border-radius: 999px;
    background: #f5f7fa;
  }

  &__body {
    padding: 20px 24px 8px;
  }
}

.empty-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    border-radius: 16px;
    background: rgba(102, 126, 234, 0.1);
    font-size: 32px;
    color: $primaryStart;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  &__desc {
    margin: 0 0 20px;
    font-size: 13px;
    color: #909399;
    max-width: 360px;
  }
}

.module-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.module-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    font-size: 22px;
    color: #fff;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__label {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }

  &__en {
    margin-top: 2px;
    font-size: 12px;
    color: #909399;
  }

  &__stat {
    text-align: center;
    flex-shrink: 0;

    strong {
      display: block;
      font-size: 22px;
      line-height: 1;
      color: #303133;
    }

    span {
      font-size: 11px;
      color: #909399;
    }
  }

  &__total {
    font-size: 14px;
    font-weight: 400;
    color: #909399;
  }

  &--listening {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.04) 100%);
    border-color: rgba(102, 126, 234, 0.15);

    .module-card__icon {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }
  }

  &--reading {
    background: linear-gradient(135deg, rgba(79, 172, 254, 0.08) 0%, rgba(0, 242, 254, 0.04) 100%);
    border-color: rgba(79, 172, 254, 0.15);

    .module-card__icon {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }
  }

  &--writing {
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.08) 0%, rgba(245, 87, 108, 0.04) 100%);
    border-color: rgba(245, 87, 108, 0.15);

    .module-card__icon {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }
  }
}

.module-tabs {
  ::v-deep .el-tabs__header {
    margin-bottom: 16px;
  }

  ::v-deep .el-tabs__item {
    height: 44px;
    line-height: 44px;
    font-size: 14px;
  }

  ::v-deep .el-tabs__active-bar {
    background: $primaryGradient;
  }

  ::v-deep .el-tabs__item.is-active {
    color: $primaryStart;
    font-weight: 600;
  }
}

.module-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .svg-icon {
    font-size: 15px;
  }

  em {
    font-style: normal;
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgba(102, 126, 234, 0.12);
    color: $primaryStart;
  }
}

.section-tip {
  margin-bottom: 16px;
}

.section-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px;
  border-radius: 10px;
  background: #fafbfc;
  border: 1px dashed #dcdfe6;
  text-align: center;
  margin-top: 12px;

  .svg-icon {
    font-size: 36px;
    color: #c0c4cc;
    margin-bottom: 12px;
  }

  p {
    margin: 0 0 14px;
    font-size: 13px;
    color: #909399;
  }
}

.subsection-block {
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #eef0f4;

  &:last-child {
    margin-bottom: 0;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
    padding: 2px 10px;
    border-radius: 999px;
    background: #f5f7fa;
  }
}

.title-block {
  margin-bottom: 8px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.12);
  background: linear-gradient(180deg, #fafbff 0%, #fff 100%);

  &--listening {
    border-color: rgba(102, 126, 234, 0.18);

    .title-block__badge {
      color: $primaryStart;
      background: rgba(102, 126, 234, 0.1);
    }

    .question-item__index {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }
  }

  &--reading {
    border-color: rgba(79, 172, 254, 0.18);

    .title-block__badge {
      color: #4facfe;
      background: rgba(79, 172, 254, 0.1);
    }

    .question-item__index {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }
  }

  &--writing {
    border-color: rgba(245, 87, 108, 0.18);

    .title-block__badge {
      color: #f5576c;
      background: rgba(245, 87, 108, 0.1);
    }

    .question-item__index {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  &__intro {
    flex: 1;
    min-width: 200px;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
  }

  &__desc {
    margin: 8px 0 0;
    font-size: 13px;
    color: #909399;
    line-height: 1.5;
  }

  &__editor-item {
    margin-bottom: 16px;

    ::v-deep .el-form-item__label {
      font-weight: 500;
    }
  }
}

.editor-wrap {
  border: 1px solid rgba(102, 126, 234, 0.15);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: rgba(102, 126, 234, 0.45);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &__toolbar {
    border-bottom: 1px solid #f0f2f5 !important;
  }

  &__body {
    height: 280px !important;
    overflow-y: hidden !important;
  }
}

.editor-placeholder {
  min-height: 280px;
  padding: 16px;
  background: #fafbfc;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  overflow: auto;
  cursor: pointer;

  &:hover {
    background: #f5f7fa;
  }
}

.question-list {
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px dashed #e4e7ed;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: #606266;

    em {
      font-style: normal;
      font-size: 12px;
      font-weight: 500;
      color: $primaryStart;
      padding: 1px 8px;
      border-radius: 999px;
      background: rgba(102, 126, 234, 0.1);
    }
  }
}

.question-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #eef0f4;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  }

  &:last-child {
    margin-bottom: 0;
  }

  &__index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: $primaryGradient;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__remove {
    flex-shrink: 0;
    color: #909399;
    font-size: 16px;
    padding: 4px;

    &:hover {
      color: #f56c6c;
    }
  }
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  position: sticky;
  bottom: 16px;
  z-index: 10;
}

.form-actions__tip {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.paper-form {
  ::v-deep .el-form-item__label {
    color: #606266;
    font-weight: 500;
  }

  ::v-deep .el-input__inner,
  ::v-deep .el-select .el-input__inner {
    border-radius: 8px;
  }
}

@media (max-width: 768px) {
  .paper-edit-page {
    padding: 16px;
  }

  .form-card__body {
    padding: 16px 16px 4px;
  }

  .module-overview {
    grid-template-columns: 1fr;
  }

  .title-block {
    padding: 14px;
  }

  .form-actions {
    flex-wrap: wrap;
  }
}
</style>

<style lang="scss">
.question-select-table {
  .el-table-column--selection .cell {
    overflow: visible;
    text-overflow: clip;
    padding-left: 10px;
    padding-right: 10px;
  }
}

.question-select-dialog {
  border-radius: 12px;
  overflow: hidden;

  .el-dialog__header {
    padding: 18px 24px 12px;
    border-bottom: 1px solid #f0f2f5;
  }

  .el-dialog__title {
    font-weight: 600;
  }

  .el-dialog__body {
    padding: 20px 24px 8px;
  }

  .question-search-form {
    margin-bottom: 4px;
  }
}

.question-item__body {
  .q-title {
    margin: 0 5px;
  }
}
</style>
