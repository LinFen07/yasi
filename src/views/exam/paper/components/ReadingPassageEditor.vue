<template>
  <div class="reading-passage-editor">
    <div ref="editorHost" class="reading-passage-editor__host" />
  </div>
</template>

<script>
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const TOOLBAR_OPTIONS = [
  ['bold', 'italic'],
  [{ align: [] }],
  ['clean']
]

export default {
  name: 'ReadingPassageEditor',
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '输入 Part 说明与阅读文章正文，Enter 换行；支持加粗、斜体、居中对齐'
    }
  },
  data () {
    return {
      quill: null,
      syncing: false
    }
  },
  mounted () {
    this.quill = new Quill(this.$refs.editorHost, {
      theme: 'snow',
      modules: {
        toolbar: TOOLBAR_OPTIONS
      },
      placeholder: this.placeholder
    })

    if (this.value) {
      this.syncing = true
      this.quill.clipboard.dangerouslyPasteHTML(this.value)
      this.syncing = false
    }

    this.quill.on('text-change', () => {
      if (this.syncing) return
      this.$emit('input', this.quill.root.innerHTML)
    })
  },
  watch: {
    value (newVal) {
      if (!this.quill || this.syncing) return
      const html = newVal || ''
      if (html === this.quill.root.innerHTML) return
      this.syncing = true
      this.quill.clipboard.dangerouslyPasteHTML(html)
      this.syncing = false
    }
  },
  beforeDestroy () {
    this.quill = null
  }
}
</script>

<style lang="scss" scoped>
.reading-passage-editor {
  border: 1px solid rgba(79, 172, 254, 0.25);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;

  &__host {
    min-height: 480px;
  }

  ::v-deep .ql-toolbar.ql-snow {
    border: none;
    border-bottom: 1px solid #ebeef5;
    background: #fafbfc;
    padding: 8px 10px;
  }

  ::v-deep .ql-container.ql-snow {
    border: none;
    font-size: 14px;
    line-height: 1.8;
  }

  ::v-deep .ql-editor {
    min-height: 420px;
    padding: 16px 18px;
    color: #303133;
  }

  ::v-deep .ql-editor.ql-blank::before {
    color: #c0c4cc;
    font-style: normal;
    left: 18px;
  }
}
</style>
