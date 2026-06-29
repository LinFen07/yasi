import { QUESTION_TYPE_META } from '../questionTypeMeta'

const EDIT_ROUTE_MAP = {
  1: '/exam/question/edit/singleChoice',
  2: '/exam/question/edit/multipleChoice',
  3: '/exam/question/edit/trueFalse',
  4: '/exam/question/edit/gapFilling',
  5: '/exam/question/edit/pick',
  6: '/exam/question/edit/drag',
  7: '/exam/question/edit/shortAnswer'
}

/** 默认年级：大学 */
export const DEFAULT_GRADE_LEVEL = 13

/** 默认难度：1 星 */
export const DEFAULT_DIFFICULT = 1

export function findDefaultSubject (subjects) {
  if (!subjects || !subjects.length) return null
  const ieltsSubject = subjects.find(item =>
    item.name && item.name.includes('雅思英语') && Number(item.level) === DEFAULT_GRADE_LEVEL
  )
  if (ieltsSubject) return ieltsSubject
  return subjects.find(item => Number(item.level) === DEFAULT_GRADE_LEVEL) || null
}

export default {
  methods: {
    ensureQuestionTypePage (data, expectedType) {
      if (!data || Number(data.questionType) === expectedType) {
        return true
      }
      const typeName = (QUESTION_TYPE_META[data.questionType] || {}).name || '对应题型'
      this.$message.warning(`该题为「${typeName}」，已跳转到专用编辑页`)
      const path = EDIT_ROUTE_MAP[data.questionType]
      if (path) {
        this.$router.replace({ path, query: { id: data.id } })
      }
      return false
    },
    finalizeQuestionForm (form) {
      form.topicType = form.questionType
      return form
    },
    isNewQuestion () {
      const id = this.$route.query.id
      return !id || parseInt(id, 10) === 0
    },
    updateSubjectFilter () {
      const grade = this.form.gradeLevel
      const subjects = this.subjects || []
      this.subjectFilter = grade != null
        ? subjects.filter(item => Number(item.level) === Number(grade))
        : [...subjects]
    },
    applyDefaultGradeSubject () {
      if (!this.isNewQuestion()) return
      const defaultSubject = findDefaultSubject(this.subjects)
      if (defaultSubject) {
        this.form.gradeLevel = Number(defaultSubject.level)
        this.form.subjectId = defaultSubject.id
      } else {
        this.form.gradeLevel = DEFAULT_GRADE_LEVEL
      }
      this.updateSubjectFilter()
      this.form.difficult = DEFAULT_DIFFICULT
    },
    bootstrapQuestionEdit (callback) {
      this.initSubject(() => {
        this.applyDefaultGradeSubject()
        if (typeof callback === 'function') {
          callback()
        }
      })
    },
    levelChange () {
      this.form.subjectId = null
      this.updateSubjectFilter()
    }
  }
}
