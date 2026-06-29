<template>
  <div class="question-edit-header">
    <div class="question-edit-header__badge">{{ typeName }}</div>
    <div v-if="tips" class="question-edit-header__tips">{{ tips }}</div>
  </div>
</template>

<script>
import { QUESTION_TYPE_META } from '../questionTypeMeta'

export default {
  name: 'QuestionEditHeader',
  props: {
    questionType: {
      type: Number,
      required: true
    }
  },
  computed: {
    meta () {
      return QUESTION_TYPE_META[this.questionType] || {}
    },
    typeName () {
      return this.meta.name || '题目编辑'
    },
    tips () {
      return this.meta.tips || ''
    }
  }
}
</script>

<style scoped>
.question-edit-header {
  margin-bottom: 20px;
  padding: 14px 16px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #1890ff;
}

.question-edit-header__badge {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.question-edit-header__tips {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}
</style>
