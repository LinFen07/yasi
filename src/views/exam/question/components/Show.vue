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
    </div>
    <div v-else-if="qType==3" v-loading="qLoading">
      <div class="q-title" v-html="question.title" style="display: inline;margin-right: 10px"/>
      <span>（</span>
      <span :key="item.id" v-for="item in question.items">
        <span v-html="item.content" class="q-item-content"></span>
       </span>
      <span>）</span>
    </div>
    <div v-else-if="qType==4" v-loading="qLoading">
      <div class="q-title" v-html="question.title"/>
    </div>
    <div v-else-if="qType==5" v-loading="qLoading">
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
  methods: {}

}
</script>

<style scoped>
.question-show-wrapper {
  line-height: 1.8;
  padding: 10px;
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
</style>

<!-- 全局样式，不使用 scoped，专门处理 v-html 内容 -->
<style>
/* 题目标题中的 p 标签样式 */
.q-title p {
  display: block !important;
  margin: 10px 0 !important;
  line-height: 1.8 !important;
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
  width: auto !important;
  max-width: 100% !important;
}

.q-title table td {
  padding: 8px !important;
  vertical-align: top !important;
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
  min-width: 60px !important;
  height: 24px !important;
  line-height: 24px !important;
  text-align: center !important;
  border: 1px solid #409EFF !important;
  border-radius: 4px !important;
  background-color: #ecf5ff !important;
  color: #409EFF !important;
  font-weight: bold !important;
  padding: 0 8px !important;
  margin: 0 4px !important;
  vertical-align: middle !important;
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
