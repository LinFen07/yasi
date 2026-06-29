// initial state
const state = {
  user: {
    sexEnum: [{ key: 1, value: '男' }, { key: 2, value: '女' }],
    statusEnum: [{ key: 1, value: '启用' }, { key: 2, value: '禁用' }],
    levelEnum: [{ key: 1, value: '一年级' }, { key: 2, value: '二年级' }, { key: 3, value: '三年级' }, { key: 4, value: '四年级' }, { key: 5, value: '五年级' }, { key: 6, value: '六年级' },
      { key: 7, value: '初一' }, { key: 8, value: '初二' }, { key: 9, value: '初三' },
      { key: 10, value: '高一' }, { key: 11, value: '高二' }, { key: 12, value: '高三' }, { key: 13, value: '大学' }],
    roleEnum: [{ key: 1, value: '学生' }, { key: 2, value: '教师' }, { key: 3, value: '管理员' }],
    statusTag: [{ key: 1, value: 'success' }, { key: 2, value: 'danger' }],
    statusBtn: [{ key: 1, value: '禁用' }, { key: 2, value: '启用' }],
    payType: [{ key: 1, value: '微信' }, { key: 2, value: '支付宝' }]
  },
    exam: {
      examPaper: {
        paperTypeEnum: [{ key: 1, value: '固定试卷' }, { key: 4, value: '时段试卷' }, { key: 6, value: '任务试卷' }],
        moduleTypeEnum: [{ key: 1, value: '听力' }, { key: 2, value: '阅读' }, { key: 3, value: '写作' }]
      },
    question: {
      typeEnum: [{ key: 1, value: '单选题' }, { key: 2, value: '多选题' }, { key: 3, value: '判断题' }, { key: 4, value: '填空题' }, { key: 5, value: '打勾题' }, { key: 6, value: '拖拽配对' }, { key: 7, value: '作文题' }],
      queTypeEnum: [{ key: 1, value: '单选题' }, { key: 2, value: '多选题' }, { key: 3, value: '判断题' }, { key: 4, value: '填空题' }, { key: 5, value: '打勾题' }, { key: 6, value: '拖拽配对' }, { key: 7, value: '作文题' }],
      editUrlEnum: [{ key: 1, value: '/exam/question/edit/singleChoice', name: '单选题' },
        { key: 2, value: '/exam/question/edit/multipleChoice', name: '多选题' },
        { key: 3, value: '/exam/question/edit/trueFalse', name: '判断题' },
        { key: 4, value: '/exam/question/edit/gapFilling', name: '填空题' },
        { key: 5, value: '/exam/question/edit/pick', name: '打勾题' },
        { key: 6, value: '/exam/question/edit/drag', name: '拖拽配对' },
        { key: 7, value: '/exam/question/edit/shortAnswer', name: '作文题' }]
    }
  }
}

// getters
const getters = {
  enumFormat: (state) => (arrary, key) => {
    return format(arrary, key)
  }
}

// actions
const actions = {}

// mutations
const mutations = {}

const format = function (array, key) {
  for (let item of array) {
    if (item.key === key) {
      return item.value
    }
  }
  return null
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
