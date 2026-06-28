<template>
  <div class="listening-section title-block title-block--listening">
    <div class="listening-section__head">
      <div class="listening-section__intro">
        <span class="title-block__badge">听力模块</span>
        <p class="title-block__desc">{{ section.desc }}</p>
      </div>
      <div class="listening-section__total">
        <strong>{{ totalCount }}</strong>
        <span>/ {{ listeningTotal }} 题</span>
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

    <div class="listening-parts-nav">
      <button
        v-for="(subsection, partIndex) in subsectionsList"
        :key="partIndex"
        type="button"
        class="listening-part-tab"
        :class="partTabClass(partIndex, subsection)"
        @click="$emit('update:activePartTab', String(partIndex))"
      >
        <span class="listening-part-tab__label">Part {{ partIndex + 1 }}</span>
        <span class="listening-part-tab__range">Q{{ partRange(partIndex).start }}–{{ partRange(partIndex).end }}</span>
        <span class="listening-part-tab__stat">{{ partCount(subsection) }}/{{ partSize }}</span>
      </button>
    </div>

    <template v-for="(subsection, partIndex) in subsectionsList">
      <div
        v-if="activePartTab === String(partIndex)"
        :key="'part-' + partIndex"
        class="listening-part-panel"
      >
      <div class="listening-part-panel__top">
        <div>
          <h4 class="listening-part-panel__title">Part {{ partIndex + 1 }}</h4>
          <p class="listening-part-panel__subtitle">
            Questions {{ partRange(partIndex).start }}–{{ partRange(partIndex).end }}
          </p>
        </div>
      </div>

      <div class="listening-part-progress">
        <div class="listening-part-progress__bar">
          <div
            class="listening-part-progress__fill"
            :style="{ width: partProgressPercent(subsection) + '%' }"
          />
        </div>
        <span class="listening-part-progress__text">{{ partCount(subsection) }} / {{ partSize }} 题</span>
      </div>

      <div class="listening-slot-grid">
        <div
          v-for="(filled, slotIndex) in partSlotStatuses(subsection)"
          :key="slotIndex"
          class="listening-slot"
          :class="{ 'listening-slot--filled': filled, 'listening-slot--active': filled && slotIndex === partCount(subsection) - 1 }"
        >
          {{ partRange(partIndex).start + slotIndex }}
        </div>
      </div>

      <el-form-item label="Part 说明" required class="title-block__editor-item">
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
            :defaultConfig="listeningEditorConfig"
            @onCreated="(editor) => $emit('editor-created', editor, subsection)"
          />
        </div>
      </el-form-item>

      <div v-if="subsection.questionItems && subsection.questionItems.length !== 0" class="question-list">
        <div class="question-list__head">
          <span>本 Part 题目</span>
          <em>{{ partCount(subsection) }} / {{ partSize }} 题</em>
          <el-button
            v-if="partCount(subsection) < partSize"
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

      <div v-else class="listening-part-empty">
        <svg-icon icon-class="message" />
        <p>Part {{ partIndex + 1 }} 暂未添加题目，请添加共 {{ partSize }} 道题</p>
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
  LISTENING_PART_SIZE,
  LISTENING_TOTAL,
  getListeningPartRange,
  getSubsectionQuestionCount,
  getPartSlotStatuses,
  getQuestionNumberLabel,
  getModuleQuestionCount
} from '../paperModule'

export default {
  name: 'ListeningSection',
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
      partSize: LISTENING_PART_SIZE,
      listeningTotal: LISTENING_TOTAL
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
    listeningEditorConfig () {
      return {
        ...this.editorConfig,
        placeholder: '请输入本 Part 说明（题型要求、注意事项等），支持图文混排...'
      }
    }
  },
  methods: {
    partRange (partIndex) {
      return getListeningPartRange(partIndex)
    },
    partCount (subsection) {
      return getSubsectionQuestionCount(subsection)
    },
    partSlotStatuses (subsection) {
      return getPartSlotStatuses(subsection)
    },
    partProgressPercent (subsection) {
      return Math.min(100, Math.round((this.partCount(subsection) / this.partSize) * 100))
    },
    questionNumberLabel (partIndex, subsection, questionIndex) {
      return getQuestionNumberLabel(partIndex, subsection, questionIndex)
    },
    partTabClass (partIndex, subsection) {
      const count = this.partCount(subsection)
      return {
        'listening-part-tab--active': this.activePartTab === String(partIndex),
        'listening-part-tab--done': count === this.partSize,
        'listening-part-tab--partial': count > 0 && count < this.partSize
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.listening-section {
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
      color: $primaryStart;
    }

    span {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #909399;
    }
  }
}

.listening-parts-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.listening-part-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  text-align: left;

  &:hover {
    border-color: rgba(102, 126, 234, 0.35);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.08);
  }

  &--active {
    border-color: rgba(102, 126, 234, 0.55);
    background: linear-gradient(180deg, rgba(102, 126, 234, 0.08) 0%, #fff 100%);
    box-shadow: 0 4px 14px rgba(102, 126, 234, 0.12);
  }

  &--done {
    .listening-part-tab__stat {
      color: #67c23a;
      background: rgba(103, 194, 58, 0.12);
    }
  }

  &--partial {
    .listening-part-tab__stat {
      color: #e6a23c;
      background: rgba(230, 162, 60, 0.12);
    }
  }

  &__label {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  &__range {
    font-size: 11px;
    color: #909399;
  }

  &__stat {
    font-size: 11px;
    font-weight: 600;
    color: $primaryStart;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(102, 126, 234, 0.1);
  }
}

.listening-part-panel {
  padding: 18px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(102, 126, 234, 0.12);

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

.listening-part-progress {
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
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: width 0.25s ease;
  }

  &__text {
    font-size: 12px;
    font-weight: 600;
    color: #606266;
    white-space: nowrap;
  }
}

.listening-slot-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
  margin-bottom: 18px;
}

.listening-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
  background: #fafbfc;
  font-size: 12px;
  font-weight: 600;
  color: #c0c4cc;
  transition: all 0.2s;

  &--filled {
    border-style: solid;
    border-color: rgba(102, 126, 234, 0.35);
    background: rgba(102, 126, 234, 0.1);
    color: $primaryStart;
  }

  &--active {
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
}

.listening-part-empty {
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
  color: $primaryStart;
  background: rgba(102, 126, 234, 0.1);
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
  border: 1px solid rgba(102, 126, 234, 0.15);
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
    background: linear-gradient(135deg, #667eea, #764ba2);
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
  .listening-parts-nav {
    grid-template-columns: repeat(2, 1fr);
  }

  .listening-slot-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
