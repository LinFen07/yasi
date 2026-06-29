<template>
  <div class="question-paper-fields">
    <el-form-item label="试卷名称：">
      <el-input
        v-model="form.paperName"
        clearable
        placeholder="建议填写，便于组卷时筛选"
      />
    </el-form-item>
    <el-form-item label="所属模块：">
      <el-select
        v-model="form.moduleType"
        clearable
        placeholder="听力 / 阅读 / 写作"
        popper-class="question-field-select-popper"
        :popper-append-to-body="true"
      >
        <el-option
          v-for="item in moduleTypeEnum"
          :key="item.key"
          :value="item.key"
          :label="item.value"
        />
      </el-select>
      <span class="field-hint">建议填写，可不填</span>
    </el-form-item>
    <el-form-item label="Part：">
      <el-input-number
        v-model="form.partNo"
        :min="1"
        :max="20"
        :step="1"
        :precision="0"
        controls-position="right"
        placeholder="Part 序号"
        class="part-no-input"
      />
      <span class="field-hint">如 Part 1、Part 2，可不填</span>
    </el-form-item>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'QuestionPaperFields',
  inject: ['elForm'],
  provide () {
    return {
      elForm: this.elForm
    }
  },
  props: {
    form: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapState('enumItem', {
      moduleTypeEnum: state => state.exam.examPaper.moduleTypeEnum
    })
  }
}
</script>

<style scoped>
.question-paper-fields {
  margin-bottom: 4px;
}

.field-hint {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.part-no-input {
  width: 140px;
}
</style>

<style>
.question-field-select-popper {
  z-index: 10050 !important;
}
</style>