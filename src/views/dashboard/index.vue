<template>
  <div class="dashboard-container">
    <div class="dashboard-hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-text">
          <h2 class="hero-title">数据概览</h2>
          <p class="hero-subtitle">欢迎回来，{{ userName || '管理员' }} · {{ todayText }}</p>
        </div>
      </div>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :xs="12" :sm="12" :lg="6" class="stat-col">
        <div class="stat-card stat-card--paper" v-loading="loading">
          <div class="stat-card__icon">
            <svg-icon icon-class="exam" />
          </div>
          <div class="stat-card__body">
            <div class="stat-card__label">试卷总数</div>
            <count-to :start-val="0" :end-val="examPaperCount" :duration="2200" class="stat-card__num" />
          </div>
          <div class="stat-card__glow"></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="stat-col">
        <div class="stat-card stat-card--question" v-loading="loading">
          <div class="stat-card__icon">
            <svg-icon icon-class="question" />
          </div>
          <div class="stat-card__body">
            <div class="stat-card__label">题目总数</div>
            <count-to :start-val="0" :end-val="questionCount" :duration="2400" class="stat-card__num" />
          </div>
          <div class="stat-card__glow"></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="stat-col">
        <div class="stat-card stat-card--answer" v-loading="loading">
          <div class="stat-card__icon">
            <svg-icon icon-class="doexampaper" />
          </div>
          <div class="stat-card__body">
            <div class="stat-card__label">答卷总数</div>
            <count-to :start-val="0" :end-val="doExamPaperCount" :duration="2600" class="stat-card__num" />
          </div>
          <div class="stat-card__glow"></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="stat-col">
        <div class="stat-card stat-card--item" v-loading="loading">
          <div class="stat-card__icon">
            <svg-icon icon-class="doquestion" />
          </div>
          <div class="stat-card__body">
            <div class="stat-card__label">答题总数</div>
            <count-to :start-val="0" :end-val="doQuestionCount" :duration="2800" class="stat-card__num" />
          </div>
          <div class="stat-card__glow"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <div class="chart-card" v-loading="loading">
          <div class="chart-card__header">
            <div>
              <h3 class="chart-card__title">用户活跃度</h3>
              <p class="chart-card__desc">本月每日用户活跃趋势</p>
            </div>
            <span class="chart-card__tag chart-card__tag--purple">月度</span>
          </div>
          <div id="echarts-moth-user" class="chart-card__body" />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <div class="chart-card" v-loading="loading">
          <div class="chart-card__header">
            <div>
              <h3 class="chart-card__title">题目月数量</h3>
              <p class="chart-card__desc">本月每日新增题目趋势</p>
            </div>
            <span class="chart-card__tag chart-card__tag--cyan">月度</span>
          </div>
          <div id="echarts-moth-question" class="chart-card__body" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import resize from './components/mixins/resize'
import CountTo from 'vue-count-to'
import dashboardApi from '@/api/dashboard'

export default {
  mixins: [resize],
  components: { CountTo },
  data () {
    return {
      examPaperCount: 0,
      questionCount: 0,
      doExamPaperCount: 0,
      doQuestionCount: 0,
      echartsUserAction: null,
      echartsQuestion: null,
      loading: false
    }
  },
  computed: {
    ...mapGetters(['userName']),
    todayText () {
      const now = new Date()
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      return `${y}年${m}月${d}日 ${weekDays[now.getDay()]}`
    }
  },
  mounted () {
    // eslint-disable-next-line no-undef
    this.echartsUserAction = echarts.init(document.getElementById('echarts-moth-user'))
    // eslint-disable-next-line no-undef
    this.echartsQuestion = echarts.init(document.getElementById('echarts-moth-question'))
    this.loading = true
    dashboardApi.index().then(re => {
      const response = re.response
      this.examPaperCount = response.examPaperCount
      this.questionCount = response.questionCount
      this.doExamPaperCount = response.doExamPaperCount
      this.doQuestionCount = response.doQuestionCount
      this.echartsUserAction.setOption(this.buildChartOption(
        '{b}日 {c} 度',
        response.mothDayText,
        response.mothDayUserActionValue,
        ['#667eea', '#764ba2']
      ))
      this.echartsQuestion.setOption(this.buildChartOption(
        '{b}日 {c} 题',
        response.mothDayText,
        response.mothDayDoExamQuestionValue,
        ['#11998e', '#38ef7d']
      ))
      this.loading = false
    })
  },
  methods: {
    buildChartOption (formatter, labels, values, colors) {
      // eslint-disable-next-line no-undef
      const areaColor = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: colors[0] + '55' },
        { offset: 1, color: colors[1] + '08' }
      ])
      return {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          borderWidth: 0,
          padding: [10, 14],
          textStyle: { color: '#fff', fontSize: 13 },
          axisPointer: {
            type: 'line',
            lineStyle: { color: colors[0], width: 1, type: 'dashed' }
          },
          formatter: (params) => {
            const item = params[0]
            return `${item.name}日<br/><span style="color:${colors[0]}">●</span> ${item.value}`
          }
        },
        grid: {
          left: 16,
          right: 24,
          bottom: 16,
          top: 24,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: labels,
          axisLine: { lineStyle: { color: '#e4e7ed' } },
          axisTick: { show: false },
          axisLabel: { color: '#909399', fontSize: 12 }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#909399', fontSize: 12 },
          splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
        },
        series: [{
          data: values,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          showSymbol: false,
          lineStyle: {
            width: 3,
            color: colors[0],
            shadowColor: colors[0] + '66',
            shadowBlur: 12,
            shadowOffsetY: 8
          },
          itemStyle: {
            color: colors[0],
            borderColor: '#fff',
            borderWidth: 2
          },
          areaStyle: { color: areaColor },
          emphasis: {
            focus: 'series',
            itemStyle: { shadowBlur: 10, shadowColor: colors[0] }
          }
        }]
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  min-height: calc(100vh - 84px);
  padding: 24px;
  background:
    radial-gradient(circle at 0% 0%, rgba(102, 126, 234, 0.08) 0%, transparent 42%),
    radial-gradient(circle at 100% 20%, rgba(56, 239, 125, 0.06) 0%, transparent 38%),
    linear-gradient(180deg, #f5f7fb 0%, #eef1f8 100%);
}

.dashboard-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
  padding: 28px 32px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 55%, #6b8cff 100%);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.28);

  .hero-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.18) 0%, transparent 35%),
      radial-gradient(circle at 10% 90%, rgba(255, 255, 255, 0.1) 0%, transparent 30%);
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .hero-title {
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.5px;
  }

  .hero-subtitle {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.88);
  }
}

.stat-row {
  margin-bottom: 8px;
}

.stat-col {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: 118px;
  padding: 22px 24px;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  transition: transform 0.28s ease, box-shadow 0.28s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    border-radius: 14px;
    font-size: 28px;
    color: #fff;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__label {
    margin-bottom: 8px;
    font-size: 14px;
    color: #909399;
  }

  &__num {
    font-size: 30px;
    font-weight: 700;
    line-height: 1;
    color: #303133;
  }

  &__glow {
    position: absolute;
    right: -20px;
    top: -20px;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    opacity: 0.12;
    pointer-events: none;
  }

  &--paper {
    .stat-card__icon,
    .stat-card__glow {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }
  }

  &--question {
    .stat-card__icon,
    .stat-card__glow {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }
  }

  &--answer {
    .stat-card__icon,
    .stat-card__glow {
      background: linear-gradient(135deg, #11998e, #38ef7d);
    }
  }

  &--item {
    .stat-card__icon,
    .stat-card__glow {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }
  }
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  padding: 22px 24px 8px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.28s ease;

  &:hover {
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.1);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f2f3f5;
  }

  &__title {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  &__desc {
    margin: 0;
    font-size: 13px;
    color: #909399;
  }

  &__tag {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;

    &--purple {
      color: #667eea;
      background: rgba(102, 126, 234, 0.12);
    }

    &--cyan {
      color: #11998e;
      background: rgba(17, 153, 142, 0.12);
    }
  }

  &__body {
    width: 100%;
    height: 360px;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .dashboard-hero {
    padding: 22px 20px;
  }

  .stat-card {
    padding: 18px 16px;

    &__num {
      font-size: 24px;
    }
  }

  .chart-card__body {
    height: 300px;
  }
}
</style>
