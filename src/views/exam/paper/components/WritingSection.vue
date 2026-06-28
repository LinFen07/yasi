<template>
  <div class="writing-section title-block title-block--writing">
    <div class="writing-section__head">
      <div class="writing-section__intro">
        <span class="title-block__badge">写作模块</span>
        <p class="title-block__desc">{{ section.desc }}</p>
      </div>
      <div class="writing-section__total">
        <strong>{{ totalCount }}</strong>
        <span>/ {{ writingTotal }} 题</span>
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

    <div class="writing-parts-nav">
      <button
        v-for="(subsection, partIndex) in subsectionsList"
        :key="partIndex"
        type="button"
        class="writing-part-tab"
        :class="partTabClass(partIndex, subsection)"
        @click="$emit('update:activePartTab', String(partIndex))"
      >
        <span class="writing-part-tab__label">Task {{ partIndex + 1 }}</span>
        <span class="writing-part-tab__stat">{{ partCount(subsection) }}/{{ partSize }}</span>
      </button>
    </div>

    <template v-for="(subsection, partIndex) in subsectionsList">
      <div
        v-if="activePartTab === String(partIndex)"
        :key="'task-' + partIndex"
        class="writing-part-panel"
      >
      <div class="writing-part-panel__top">
        <div>
          <h4 class="writing-part-panel__title">Task {{ partIndex + 1 }}</h4>
          <p class="writing-part-panel__subtitle">每 Task 固定 1 道作文题</p>
        </div>
      </div>

      <div class="writing-part-progress">
        <div class="writing-part-progress__bar">
          <div
            class="writing-part-progress__fill"
            :style="{ width: partProgressPercent(subsection) + '%' }"
          />
        </div>
        <span class="writing-part-progress__text">{{ partCount(subsection) }} / {{ partSize }} 题</span>
      </div>

      <div class="writing-slot-grid">
        <div
          v-for="(filled, slotIndex) in partSlotStatuses(subsection)"
          :key="slotIndex"
          class="writing-slot"
          :class="{ 'writing-slot--filled': filled }"
        >
          Task {{ partIndex + 1 }}
        </div>
      </div>

      <el-form-item label="Task 说明" required class="title-block__editor-item">
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
            :defaultConfig="writingEditorConfig"
            @onCreated="(editor) => $emit('editor-created', editor, subsection)"
          />
        </div>
      </el-form-item>

      <div v-if="subsection.questionItems && subsection.questionItems.length !== 0" class="question-list">
        <div class="question-list__head">
          <span>本 Task 题目</span>
          <em>{{ partCount(subsection) }} / {{ partSize }} 题</em>
        </div>
        <div
          v-for="(questionItem, questionIndex) in subsection.questionItems"
          :key="questionIndex"
          class="question-item"
        >
          <div class="question-item__index">Task {{ partIndex + 1 }}</div>
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

      <div v-else class="writing-part-empty">
        <svg-icon icon-class="edit" />
        <p>Task {{ partIndex + 1 }} 暂未添加作文题，请添加 1 道作文题</p>
        <el-button type="primary" plain size="small" @click="$emit('add-question', subsection, sectionIndex)">
          添加作文题
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
  WRITING_PART_SIZE,
  WRITING_TOTAL,
  getSubsectionQuestionCount,
  getModuleQuestionCount,
  getWritingPartSlotStatuses
} from '../paperModule'

export default {
  name: 'WritingSection',
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
  data () {
    return {
      partSize: WRITING_PART_SIZE,
      writingTotal: WRITING_TOTAL
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
    writingEditorConfig () {
      return {
        ...this.editorConfig,
        placeholder: '请输入本 Task 要求（字数限制、评分要点等），支持图文混排...'
      }
    }
  },
  methods: {
    partCount (subsection) {
      return getSubsectionQuestionCount(subsection)
    },
    partSlotStatuses (subsection) {
      return getWritingPartSlotStatuses(subsection)
    },
    partProgressPercent (subsection) {
      return Math.min(100, Math.round((this.partCount(subsection) / this.partSize) * 100))
    },
    partTabClass (partIndex, subsection) {
      const count = this.partCount(subsection)
      return {
        'writing-part-tab--active': this.activePartTab === String(partIndex),
        'writing-part-tab--done': count === this.partSize,
        'writing-part-tab--partial': count > 0 && count < this.partSize
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

$writingStart: #f093fb;
$writingEnd: #f5576c;

.writing-section {
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
      color: $writingEnd;
    }

    span {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #909399;
    }
  }
}

.writing-parts-nav {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.writing-part-tab {
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
    border-color: rgba(245, 87, 108, 0.35);
    box-shadow: 0 4px 12px rgba(245, 87, 108, 0.08);
  }

  &--active {
    border-color: rgba(245, 87, 108, 0.55);
    background: linear-gradient(180deg, rgba(240, 147, 251, 0.08) 0%, #fff 100%);
    box-shadow: 0 4px 14px rgba(245, 87, 108, 0.12);
  }

  &--done {
    .writing-part-tab__stat {
      color: #67c23a;
      background: rgba(103, 194, 58, 0.12);
    }
  }

  &--partial {
    .writing-part-tab__stat {
      color: #e6a23c;
      background: rgba(230, 162, 60, 0.12);
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
    color: $writingEnd;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(245, 87, 108, 0.1);
  }
}

.writing-part-panel {
  padding: 18px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(245, 87, 108, 0.12);

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

.writing-part-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;

  &__bar {
    flex: 1;
    height: 8px;
    border-radius: 999px;
    background: #eef0f4;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, $writingStart, $writingEnd);
    transition: width 0.25s ease;
  }

  &__text {
    font-size: 12px;
    font-weight: 600;
    color: #606266;
    white-space: nowrap;
  }
}

.writing-slot-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}

.writing-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  border-radius: 10px;
  border: 1px dashed #dcdfe6;
  background: #fafbfc;
  font-size: 13px;
  font-weight: 600;
  color: #c0c4cc;
  transition: all 0.2s;

  &--filled {
    border-style: solid;
    border-color: rgba(245, 87, 108, 0.35);
    background: rgba(240, 147, 251, 0.1);
    color: $writingEnd;
  }
}

.writing-part-empty {
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
  color: $writingEnd;
  background: rgba(245, 87, 108, 0.1);
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
  border: 1px solid rgba(245, 87, 108, 0.15);
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

    em {
      font-style: normal;
      font-size: 12px;
      font-weight: 500;
      color: $writingEnd;
      padding: 1px 8px;
      border-radius: 999px;
      background: rgba(245, 87, 108, 0.1);
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
    min-width: 56px;
    height: 28px;
    padding: 0 8px;
    border-radius: 8px;
    background: linear-gradient(135deg, $writingStart, $writingEnd);
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
  .writing-parts-nav,
  .writing-slot-grid {
    grid-template-columns: 1fr;
  }
}
</style>
