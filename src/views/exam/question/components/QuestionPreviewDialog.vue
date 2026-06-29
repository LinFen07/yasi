<template>
  <el-dialog
    title="题目预览"
    :visible.sync="innerVisible"
    width="900px"
    top="5vh"
    append-to-body
    custom-class="question-preview-dialog"
  >
    <QuestionShow :q-type="qType" :question="question" :q-loading="qLoading" />
  </el-dialog>
</template>

<script>
import QuestionShow from './Show'

export default {
  name: 'QuestionPreviewDialog',
  components: { QuestionShow },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    qType: {
      type: Number,
      default: 0
    },
    question: {
      type: Object,
      default: () => ({})
    },
    qLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    innerVisible: {
      get () {
        return this.visible
      },
      set (val) {
        this.$emit('update:visible', val)
      }
    }
  }
}
</script>
