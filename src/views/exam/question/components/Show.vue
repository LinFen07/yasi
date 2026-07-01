<template>
  <div class="question-show-wrapper">
    <div v-if="qType==1" v-loading="qLoading">
      <div class="q-title" v-html="question.title"/>
      <div class="q-content">
          <span :key="item.id" v-for="item in question.items" class="q-item-contain">
            <span class="q-item-prefix">{{item.prefix}}</span>
            <span v-html="item.content" class="q-item-content"></span>
          </span>
      </div>
    </div>
    <div v-else-if="qType==2" v-loading="qLoading">
      <div class="q-title" v-html="question.title"/>
      <div class="q-content">
          <span :key="item.id" v-for="item in question.items" class="q-item-contain">
            <span class="q-item-prefix">{{item.prefix}}</span>
            <span v-html="item.content" class="q-item-content"></span>
          </span>
      </div>
      <div v-if="question.correctArray && question.correctArray.length" class="q-answer-tip">
        正确答案：{{ question.correctArray.join(', ') }}（每选对一项单独计分）
      </div>
    </div>
    <div v-else-if="qType==3" v-loading="qLoading">
      <div class="q-title" v-html="question.title" style="display: inline;margin-right: 10px"/>
      <span>（</span>
      <span :key="item.id" v-for="item in question.items">
        <span v-html="item.content" class="q-item-content"></span>
       </span>
      <span>）</span>
    </div>
    <div v-else-if="qType==4" v-loading="qLoading" class="q-gap-filling">
      <div class="q-title q-rich-content" v-html="question.title"/>
    </div>
    <div v-else-if="qType==5" v-loading="qLoading">
      <div class="q-title" v-html="question.title"/>
      <div class="q-content">
        <span :key="item.prefix" v-for="item in question.items" class="q-item-contain">
          <span class="q-item-prefix">{{item.prefix}}</span>
          <span v-html="item.content" class="q-item-content"></span>
        </span>
      </div>
      <div v-if="question.correctArray && question.correctArray.length" class="q-answer-tip">
        正确答案：{{ question.correctArray.join(', ') }}
      </div>
    </div>
    <div v-else-if="qType==6" v-loading="qLoading" class="q-drag-matching">
      <div class="q-title" v-html="question.title"/>
      <div class="q-section-title">右侧选项</div>
      <div class="q-drag-options">
        <div v-for="item in optionItems" :key="'opt-' + item.prefix" class="q-drag-option-chip">
          <strong>{{ item.prefix }}.</strong>
          <span v-html="item.content" class="q-item-content"></span>
        </div>
      </div>
      <div class="q-section-title">配对（左侧描述 → 正确选项）</div>
      <el-table :data="promptItems" border size="small" class="q-drag-prompt-preview">
        <el-table-column prop="prefix" label="题号" width="72" align="center" />
        <el-table-column label="左侧描述（含空位）">
          <template slot-scope="{ row }">
            <div class="drag-describe-preview" v-html="row.describe || '—'"></div>
          </template>
        </el-table-column>
        <el-table-column label="应选" width="120" align="center">
          <template slot-scope="{ row }">
            <span class="q-drag-answer-tag">{{ row.content }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-else-if="qType==7" v-loading="qLoading">
      <div class="q-title" v-html="question.title"/>
    </div>
    <div v-else>
    </div>
  </div>

</template>

<script>
export default {
  name: 'QuestionShow',
  props: {
    question: {
      type: Object,
      default: function () {
        return {}
      }
    },
    qLoading: {
      type: Boolean,
      default: false
    },
    qType: {
      type: Number,
      default: 0
    }
  },
  computed: {
    optionItems () {
      const items = (this.question && this.question.items) || []
      return items.filter(item => item.itemUuid === 'option')
    },
    promptItems () {
      const items = (this.question && this.question.items) || []
      return items.filter(item => item.itemUuid === 'prompt')
    }
  },
  methods: {}

}
</script>

<style scoped>
.question-show-wrapper {
  line-height: 1.8;
  padding: 4px 0;
  max-width: 100%;
  overflow-x: auto;
}

.q-gap-filling {
  min-width: 0;
}

.q-rich-content {
  font-size: 14px;
  color: #303133;
}

.q-item-contain {
  display: block;
  margin-bottom: 10px;
  line-height: 1.8;
}

.q-item-prefix {
  font-weight: bold;
  margin-right: 8px;
}

.q-section-title {
  margin: 12px 0 8px;
  font-weight: 600;
  color: #303133;
}

.q-answer-tip {
  margin-top: 12px;
  color: #409EFF;
}

.q-drag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.q-drag-option-chip {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
}

.q-drag-prompt-preview {
  max-width: 100%;
}

.q-drag-answer-tag {
  display: inline-block;
  min-width: 28px;
  padding: 2px 10px;
  border: 1px solid #409EFF;
  border-radius: 4px;
  background: #ecf5ff;
  color: #409EFF;
  font-weight: 600;
}

.drag-describe-preview .drag-slot {
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

<!-- 全局样式，不使用 scoped，专门处理 v-html 内容 -->
<style>
/* 题目标题中的 p 标签样式 */
.q-title p,
.q-title p.ueditor-p {
  display: block !important;
  margin: 10px 0 !important;
  line-height: 1.8 !important;
}

.q-title table p,
.q-title table p.ueditor-p {
  margin: 4px 0 !important;
}

.q-title p:first-child {
  margin-top: 0 !important;
}

.q-title p:last-child {
  margin-bottom: 0 !important;
}

/* 表格样式 */
.q-title table {
  border-collapse: collapse !important;
  margin: 15px 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border: 1px solid #c0c4cc !important;
  table-layout: fixed !important;
  box-sizing: border-box !important;
}

.q-title table.gap-question-table {
  width: 100% !important;
  max-width: 720px !important;
}

.q-rich-content table {
  min-width: 560px;
}

.q-rich-content table.gap-question-table {
  min-width: 0 !important;
  max-width: 720px !important;
}

.q-title table td,
.q-title table th {
  border: 1px solid #c0c4cc !important;
  padding: 10px 12px !important;
  vertical-align: top !important;
  line-height: 1.6 !important;
  word-break: break-word !important;
}

.q-title table th,
.q-title table.gap-question-table tr:first-child td {
  background-color: #f5f7fa !important;
  font-weight: 600 !important;
}

/* 图片样式 */
.q-title img {
  max-width: 100% !important;
  height: auto !important;
  display: block !important;
  margin: 10px 0 !important;
}

/* 填空题标记 */
.q-title .gapfilling-span {
  display: inline-block !important;
  min-width: 48px !important;
  width: auto !important;
  height: 22px !important;
  line-height: 20px !important;
  text-align: center !important;
  border: 1px solid #409EFF !important;
  border-radius: 4px !important;
  background-color: #ecf5ff !important;
  color: #409EFF !important;
  font-weight: bold !important;
  font-size: 12px !important;
  padding: 0 6px !important;
  margin: 0 2px !important;
  vertical-align: baseline !important;
  box-sizing: border-box !important;
}

/* 其他文本样式 */
.q-title strong {
  font-weight: bold !important;
}

.q-title em {
  font-style: italic !important;
}

/* 选项中的 p 标签保持内联 */
.q-item-content p {
  display: inline !important;
  margin: 0 !important;
}
</style>
