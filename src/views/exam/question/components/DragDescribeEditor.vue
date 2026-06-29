<template>
  <div class="drag-describe-editor">
    <div class="drag-describe-editor__toolbar">
      <el-button type="primary" size="mini" plain @click="insertSlot">插入空位</el-button>
      <span class="drag-describe-editor__hint">光标放在文字前/中/后，点击插入拖放框</span>
    </div>
    <div
      ref="editor"
      class="drag-describe-editor__input"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="emitChange"
      @blur="emitChange"
    />
    <div v-if="missingSlot" class="drag-describe-editor__warn">请插入至少一个空位，标出选项拖放位置</div>
  </div>
</template>

<script>
import { DRAG_SLOT_HTML, hasDragSlot } from '../utils/dragSlotMarkup'

export default {
  name: 'DragDescribeEditor',
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    }
  },
  computed: {
    missingSlot () {
      const html = this.value || ''
      if (!html.trim()) return false
      return !hasDragSlot(html)
    }
  },
  watch: {
    value (val) {
      this.syncEditor(val)
    }
  },
  mounted () {
    this.syncEditor(this.value)
  },
  methods: {
    syncEditor (val) {
      const editor = this.$refs.editor
      if (!editor) return
      const next = val || ''
      if (editor.innerHTML !== next) {
        editor.innerHTML = next
      }
    },
    emitChange () {
      const html = this.$refs.editor ? this.$refs.editor.innerHTML : ''
      this.$emit('input', html)
    },
    insertSlot () {
      const editor = this.$refs.editor
      if (!editor) return
      editor.focus()
      document.execCommand('insertHTML', false, DRAG_SLOT_HTML)
      this.emitChange()
    }
  }
}
</script>

<style scoped>
.drag-describe-editor__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.drag-describe-editor__hint {
  color: #909399;
  font-size: 12px;
}

.drag-describe-editor__input {
  min-height: 36px;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  line-height: 1.6;
  font-size: 14px;
  background: #fff;
  word-break: break-word;
}

.drag-describe-editor__input:focus {
  outline: none;
  border-color: #409eff;
}

.drag-describe-editor__input:empty::before {
  content: attr(data-placeholder);
  color: #c0c4cc;
}

.drag-describe-editor__warn {
  margin-top: 4px;
  color: #f56c6c;
  font-size: 12px;
}
</style>

<style>
.drag-describe-editor__input .drag-slot {
  display: inline-block;
  min-width: 72px;
  height: 22px;
  margin: 0 4px;
  border: 1px dashed #409eff;
  border-radius: 4px;
  background: #ecf5ff;
  vertical-align: middle;
  box-sizing: border-box;
}
</style>
