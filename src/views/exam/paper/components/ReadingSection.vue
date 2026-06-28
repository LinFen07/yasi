<template>
  <div class="reading-section title-block title-block--reading">
    <div class="reading-section__head">
      <div class="reading-section__intro">
        <span class="title-block__badge">阅读模块</span>
        <p class="title-block__desc">{{ section.desc }}</p>
      </div>
      <div class="reading-section__total">
        <strong>{{ totalCount }}</strong>
        <span>题</span>
      </div>
    </div>

    <el-alert
      v-if="section.tip"
      :title="section.tip"
      type="info"
      :closable="false"
      show-icon
      class="section-tip"
    />

    <div class="reading-parts-nav">
      <button
        v-for="(subsection, partIndex) in subsectionsList"
        :key="partIndex"
        type="button"
        class="reading-part-tab"
        :class="partTabClass(partIndex, subsection)"
        @click="$emit('update:activePartTab', String(partIndex))"
      >
        <span class="reading-part-tab__label">Passage {{ partIndex + 1 }}</span>
        <span class="reading-part-tab__stat">{{ partCount(subsection) }} 题</span>
      </button>
    </div>

    <template v-for="(subsection, partIndex) in subsectionsList">
      <div
        v-if="activePartTab === String(partIndex)"
        :key="'passage-' + partIndex"
        class="reading-part-panel"
      >
      <div class="reading-part-panel__top">
        <div>
          <h4 class="reading-part-panel__title">Passage {{ partIndex + 1 }}</h4>
          <p class="reading-part-panel__subtitle">
            已添加 {{ partCount(subsection) }} 道题
            <template v-if="partCount(subsection) > 0">
              · Q{{ questionRange(partIndex).start }}<template v-if="questionRange(partIndex).end > questionRange(partIndex).start">–{{ questionRange(partIndex).end }}</template>
            </template>
          </p>
        </div>
      </div>

      <el-form-item label="Passage 说明" required class="title-block__editor-item">
        <div class="editor-wrap">
          <Toolbar
            v-if="subsection.editor"
            class="editor-wrap__toolbar"
            :editor="subsection.editor"
            :defaultConfig="toolbarConfig"
          />
          <Editor
            v-model="subsection.name"
            class="editor-wrap__body"
            :defaultConfig="readingEditorConfig"
            @onCreated="(editor) => $emit('editor-created', editor, subsection)"
          />
        </div>
      </el-form-item>

      <div v-if="subsection.questionItems && subsection.questionItems.length !== 0" class="question-list">
        <div class="question-list__head">
          <span>本 Passage 题目</span>
          <em>{{ partCount(subsection) }} 道</em>
          <el-button
            type="primary"
            plain
            size="mini"
            icon="el-icon-plus"
            @click="$emit('add-question', subsection, sectionIndex)"
          >
            添加题目
          </el-button>
        </div>
        <div
          v-for="(questionItem, questionIndex) in subsection.questionItems"
          :key="questionIndex"
          class="question-item"
        >
          <div class="question-item__index">{{ questionNumberLabel(partIndex, subsection, questionIndex) }}</div>
          <div class="question-item__body">
            <QuestionShow :qType="questionItem.questionType" :question="questionItem" />
          </div>
          <el-button
            type="text"
            class="question-item__remove"
            icon="el-icon-close"
            @click="subsection.questionItems.splice(questionIndex, 1)"
          />
        </div>
      </div>

      <div v-else class="reading-part-empty">
        <svg-icon icon-class="documentation" />
        <p>Passage {{ partIndex + 1 }} 暂未添加题目</p>
        <el-button type="primary" plain size="small" @click="$emit('add-question', subsection, sectionIndex)">
          添加题目
        </el-button>
      </div>
      </div>
    </template>
  </div>
</template>

<script>
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import QuestionShow from '../../question/components/Show'
import {
  getSubsectionQuestionCount,
  getModuleQuestionCount,
  getReadingQuestionNumberLabel,
  getReadingQuestionStartInModule
} from '../paperModule'

export default {
  name: 'ReadingSection',
  components: { Editor, Toolbar, QuestionShow },
  props: {
    module: {
      type: Object,
      default: null
    },
    section: {
      type: Object,
      required: true
    },
    sectionIndex: {
      type: Number,
      default: 0
    },
    activePartTab: {
      type: String,
      default: '0'
    },
    toolbarConfig: {
      type: Object,
      default: () => ({})
    },
    editorConfig: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    subsectionsList () {
      if (!this.module || !this.module.subsections) {
        return []
      }
      return this.module.subsections
    },
    totalCount () {
      if (!this.module) {
        return 0
      }
      return getModuleQuestionCount(this.module)
    },
    readingEditorConfig () {
      return {
        ...this.editorConfig,
        placeholder: '请输入本 Passage 说明（文章概述、答题要求等），支持图文混排...'
      }
    }
  },
  methods: {
    partCount (subsection) {
      return getSubsectionQuestionCount(subsection)
    },
    questionRange (partIndex) {
      const subsection = this.subsectionsList[partIndex]
      const count = this.partCount(subsection)
      if (count === 0) {
        return { start: 0, end: 0 }
      }
      const start = getReadingQuestionStartInModule(this.module, partIndex)
      return { start, end: start + count - 1 }
    },
    questionNumberLabel (partIndex, subsection, questionIndex) {
      return getReadingQuestionNumberLabel(this.module, partIndex, subsection, questionIndex)
    },
    partTabClass (partIndex, subsection) {
      const count = this.partCount(subsection)
      return {
        'reading-part-tab--active': this.activePartTab === String(partIndex),
        'reading-part-tab--done': count > 0,
        'reading-part-tab--empty': count === 0
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

$readingStart: #4facfe;
$readingEnd: #00f2fe;

.reading-section {
  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  &__intro {
    flex: 1;
    min-width: 200px;
  }

  &__total {
    text-align: right;
    flex-shrink: 0;

    strong {
      font-size: 28px;
      line-height: 1;
      color: $readingStart;
    }

    span {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #909399;
    }
  }
}

.reading-parts-nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.reading-part-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  text-align: left;

  &:hover {
    border-color: rgba(79, 172, 254, 0.35);
    box-shadow: 0 4px 12px rgba(79, 172, 254, 0.08);
  }

  &--active {
    border-color: rgba(79, 172, 254, 0.55);
    background: linear-gradient(180deg, rgba(79, 172, 254, 0.08) 0%, #fff 100%);
    box-shadow: 0 4px 14px rgba(79, 172, 254, 0.12);
  }

  &--done {
    .reading-part-tab__stat {
      color: #67c23a;
      background: rgba(103, 194, 58, 0.12);
    }
  }

  &--empty {
    .reading-part-tab__stat {
      color: #909399;
      background: #f5f7fa;
    }
  }

  &__label {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  &__stat {
    font-size: 11px;
    font-weight: 600;
    color: $readingStart;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(79, 172, 254, 0.1);
  }
}

.reading-part-panel {
  padding: 18px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(79, 172, 254, 0.12);

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  &__subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #909399;
  }
}

.reading-part-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 16px;
  margin-top: 8px;
  border-radius: 10px;
  background: #fafbfc;
  border: 1px dashed #dcdfe6;
  text-align: center;

  .svg-icon {
    font-size: 32px;
    color: #c0c4cc;
    margin-bottom: 10px;
  }

  p {
    margin: 0 0 12px;
    font-size: 13px;
    color: #909399;
  }
}

.title-block__badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: $readingStart;
  background: rgba(79, 172, 254, 0.1);
}

.title-block__desc {
  margin: 8px 0 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}

.title-block__editor-item {
  margin-bottom: 16px;

  ::v-deep .el-form-item__label {
    font-weight: 500;
    white-space: nowrap;
  }

  ::v-deep .el-form-item__content {
    flex: 1;
    min-width: 0;
  }
}

.editor-wrap {
  border: 1px solid rgba(79, 172, 254, 0.15);
  border-radius: 10px;
  overflow: hidden;

  &__toolbar {
    border-bottom: 1px solid #f0f2f5 !important;
  }

  &__body {
    height: 240px !important;
    overflow-y: hidden !important;
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

    .el-button {
      margin-left: auto;
    }

    em {
      font-style: normal;
      font-size: 12px;
      font-weight: 500;
      color: $readingStart;
      padding: 1px 8px;
      border-radius: 999px;
      background: rgba(79, 172, 254, 0.1);
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

  &:last-child {
    margin-bottom: 0;
  }

  &__index {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 28px;
    padding: 0 6px;
    border-radius: 8px;
    background: linear-gradient(135deg, $readingStart, $readingEnd);
    color: #fff;
    font-size: 12px;
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

    &:hover {
      color: #f56c6c;
    }
  }
}

.section-tip {
  margin-bottom: 16px;
}

@media (max-width: 992px) {
  .reading-parts-nav {
    grid-template-columns: 1fr;
  }
}
</style>
