export const LISTENING_PART_COUNT = 4
export const LISTENING_PART_SIZE = 10
export const LISTENING_TOTAL = LISTENING_PART_COUNT * LISTENING_PART_SIZE

export const READING_PART_COUNT = 3

export const WRITING_PART_COUNT = 2
export const WRITING_PART_SIZE = 1
export const WRITING_TOTAL = WRITING_PART_COUNT * WRITING_PART_SIZE

export const IELTS_SECTIONS = [
  {
    key: 1,
    label: '听力',
    enLabel: 'Listening',
    icon: 'message',
    theme: 'listening',
    desc: '共 4 个 Part，每 Part 固定 10 题，合计 40 题',
    defaultName: '<p><strong>Part 1 · Listening 听力</strong></p><p>请填写本 Part 说明（题型要求、注意事项等）</p>',
    suggestQuestionType: null,
    tip: '听力共 4 个 Part，每 Part 10 题；音频请在「试卷列表」页对应试卷的「听力」按钮中上传'
  },
  {
    key: 2,
    label: '阅读',
    enLabel: 'Reading',
    icon: 'documentation',
    theme: 'reading',
    desc: '共 3 个 Passage，每 Part 题目数量不限',
    defaultName: '<p><strong>Passage 1 · Reading 阅读</strong></p><p>请填写本 Passage 说明（文章概述、答题要求等）</p>',
    suggestQuestionType: null,
    tip: '阅读共 3 个 Passage，各 Part 题目数量根据题型灵活配置'
  },
  {
    key: 3,
    label: '写作',
    enLabel: 'Writing',
    icon: 'edit',
    theme: 'writing',
    desc: '共 2 个 Task，每 Task 固定 1 道作文题',
    defaultName: '<p><strong>Task 1 · Writing 写作</strong></p><p>请填写 Task 1 要求（如图表描述、字数限制等）</p>',
    suggestQuestionType: 5,
    tip: '写作共 Task 1、Task 2，各添加 1 道作文题，提交后由评阅老师批改'
  }
]

export function stripHtml (html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function detectModuleKey (nameHtml) {
  const text = stripHtml(nameHtml).toUpperCase()
  if (text.includes('WRITING TASK') || text.includes('写作')) {
    return 3
  }
  if (text.includes('READING PASSAGE') || text.includes('阅读')) {
    return 2
  }
  return 1
}

export function listeningPartDefaultName (partIndex) {
  const start = partIndex * LISTENING_PART_SIZE + 1
  const end = start + LISTENING_PART_SIZE - 1
  return `<p><strong>Part ${partIndex + 1} · Listening 听力</strong></p><p><em>Listen and answer questions ${start}–${end}.</em></p><p>请填写本 Part 说明（题型要求、注意事项等）</p>`
}

export function getListeningPartRange (partIndex) {
  const start = partIndex * LISTENING_PART_SIZE + 1
  return { start, end: start + LISTENING_PART_SIZE - 1 }
}

export function readingPartDefaultName (partIndex) {
  return `<p><strong>Passage ${partIndex + 1} · Reading 阅读</strong></p><p>请填写本 Passage 说明（文章概述、答题要求等）</p>`
}

export function writingPartDefaultName (partIndex) {
  const taskNum = partIndex + 1
  return `<p><strong>Task ${taskNum} · Writing 写作</strong></p><p>请填写 Task ${taskNum} 要求（字数限制、评分要点等）</p>`
}

export function createListeningModule () {
  return {
    moduleKey: 1,
    subsections: Array.from({ length: LISTENING_PART_COUNT }, (_, i) =>
      createSubsection(listeningPartDefaultName(i))
    )
  }
}

export function normalizeListeningModule (module) {
  const existing = (module && module.subsections) ? module.subsections : []
  const subsections = []
  for (let i = 0; i < LISTENING_PART_COUNT; i++) {
    if (existing[i]) {
      subsections.push(existing[i])
    } else {
      subsections.push(createSubsection(listeningPartDefaultName(i)))
    }
  }
  if (existing.length > LISTENING_PART_COUNT) {
    for (let i = LISTENING_PART_COUNT; i < existing.length; i++) {
      subsections[LISTENING_PART_COUNT - 1].questionItems.push(...(existing[i].questionItems || []))
    }
  }
  return {
    moduleKey: 1,
    subsections
  }
}

export function createReadingModule () {
  return {
    moduleKey: 2,
    subsections: Array.from({ length: READING_PART_COUNT }, (_, i) =>
      createSubsection(readingPartDefaultName(i))
    )
  }
}

export function normalizeReadingModule (module) {
  const existing = (module && module.subsections) ? module.subsections : []
  const subsections = []
  for (let i = 0; i < READING_PART_COUNT; i++) {
    if (existing[i]) {
      subsections.push(existing[i])
    } else {
      subsections.push(createSubsection(readingPartDefaultName(i)))
    }
  }
  if (existing.length > READING_PART_COUNT) {
    for (let i = READING_PART_COUNT; i < existing.length; i++) {
      const extra = existing[i]
      if (extra && extra.questionItems) {
        subsections[READING_PART_COUNT - 1].questionItems.push(...extra.questionItems)
      }
    }
  }
  return {
    moduleKey: 2,
    subsections
  }
}

export function createWritingModule () {
  return {
    moduleKey: 3,
    subsections: Array.from({ length: WRITING_PART_COUNT }, (_, i) =>
      createSubsection(writingPartDefaultName(i))
    )
  }
}

export function normalizeWritingModule (module) {
  const existing = (module && module.subsections) ? module.subsections : []
  const subsections = []
  for (let i = 0; i < WRITING_PART_COUNT; i++) {
    if (existing[i]) {
      subsections.push(existing[i])
    } else {
      subsections.push(createSubsection(writingPartDefaultName(i)))
    }
  }
  if (existing.length > WRITING_PART_COUNT) {
    for (let i = WRITING_PART_COUNT; i < existing.length; i++) {
      const extra = existing[i]
      if (extra && extra.questionItems) {
        subsections[WRITING_PART_COUNT - 1].questionItems.push(...extra.questionItems)
      }
    }
  }
  return {
    moduleKey: 3,
    subsections
  }
}

export function getReadingQuestionStartInModule (module, partIndex) {
  let start = 1
  const subsections = (module && module.subsections) ? module.subsections : []
  for (let i = 0; i < partIndex; i++) {
    start += getSubsectionQuestionCount(subsections[i])
  }
  return start
}

export function getReadingQuestionNumberLabel (module, partIndex, subsection, questionIndex) {
  const partStart = getReadingQuestionStartInModule(module, partIndex)
  const localStart = getQuestionStartInPart(subsection, questionIndex)
  const globalStart = partStart + localStart - 1
  const slots = countQuestionSlots(subsection.questionItems[questionIndex])
  if (slots <= 1) {
    return String(globalStart)
  }
  return `${globalStart}–${globalStart + slots - 1}`
}

export function getWritingPartSlotStatuses (subsection) {
  const statuses = Array(WRITING_PART_SIZE).fill(false)
  let filled = 0
  ;(subsection.questionItems || []).forEach(question => {
    const slots = countQuestionSlots(question)
    for (let s = 0; s < slots && filled < WRITING_PART_SIZE; s++) {
      statuses[filled] = true
      filled++
    }
  })
  return statuses
}

export function validateReadingModule (module) {
  const errors = []
  const subsections = (module && module.subsections) ? module.subsections : []
  for (let i = 0; i < READING_PART_COUNT; i++) {
    const count = getSubsectionQuestionCount(subsections[i])
    if (count === 0) {
      errors.push({
        partIndex: i,
        count,
        message: `阅读 Passage ${i + 1} 尚未添加题目`
      })
    }
  }
  return errors
}

export function validateWritingModule (module) {
  const errors = []
  const subsections = (module && module.subsections) ? module.subsections : []
  for (let i = 0; i < WRITING_PART_COUNT; i++) {
    const count = getSubsectionQuestionCount(subsections[i])
    if (count !== WRITING_PART_SIZE) {
      errors.push({
        partIndex: i,
        count,
        message: `写作 Task ${i + 1} 应为 ${WRITING_PART_SIZE} 道题，当前 ${count} 题`
      })
    }
  }
  return errors
}

export function getPartSlotStatuses (subsection) {
  const statuses = Array(LISTENING_PART_SIZE).fill(false)
  let filled = 0
  ;(subsection.questionItems || []).forEach(question => {
    const slots = countQuestionSlots(question)
    for (let s = 0; s < slots && filled < LISTENING_PART_SIZE; s++) {
      statuses[filled] = true
      filled++
    }
  })
  return statuses
}

export function getQuestionStartInPart (subsection, questionIndex) {
  let start = 1
  for (let i = 0; i < questionIndex; i++) {
    start += countQuestionSlots(subsection.questionItems[i])
  }
  return start
}

export function getQuestionNumberLabel (partIndex, subsection, questionIndex) {
  const slots = countQuestionSlots(subsection.questionItems[questionIndex])
  const localStart = getQuestionStartInPart(subsection, questionIndex)
  const globalStart = partIndex * LISTENING_PART_SIZE + localStart
  if (slots <= 1) {
    return String(globalStart)
  }
  return `${globalStart}–${globalStart + slots - 1}`
}

export function validateListeningModule (module) {
  const errors = []
  const subsections = (module && module.subsections) ? module.subsections : []
  for (let i = 0; i < LISTENING_PART_COUNT; i++) {
    const count = getSubsectionQuestionCount(subsections[i])
    if (count !== LISTENING_PART_SIZE) {
      errors.push({
        partIndex: i,
        count,
        message: `听力 Part ${i + 1} 应为 ${LISTENING_PART_SIZE} 题，当前 ${count} 题`
      })
    }
  }
  return errors
}

export function createSubsection (name, questionItems = []) {
  return {
    name: name || '',
    questionItems: questionItems || [],
    editor: null
  }
}

export function createEmptyModule (section) {
  return {
    moduleKey: section.key,
    subsections: [createSubsection(section.defaultName)]
  }
}

export function initModuleTitleItems () {
  return [
    createListeningModule(),
    createReadingModule(),
    createWritingModule()
  ]
}

export function groupTitleItemsForEdit (flatItems) {
  const grouped = {
    1: [],
    2: [],
    3: []
  }

  ;(flatItems || []).forEach(item => {
    const moduleKey = detectModuleKey(item.name)
    grouped[moduleKey].push(createSubsection(item.name, item.questionItems || []))
  })

  return IELTS_SECTIONS.map(section => {
    if (section.key === 1) {
      if (grouped[1].length > 0) {
        return normalizeListeningModule({ moduleKey: 1, subsections: grouped[1] })
      }
      return createListeningModule()
    }
    if (section.key === 2) {
      if (grouped[2].length > 0) {
        return normalizeReadingModule({ moduleKey: 2, subsections: grouped[2] })
      }
      return createReadingModule()
    }
    if (grouped[section.key].length > 0) {
      return normalizeWritingModule({ moduleKey: section.key, subsections: grouped[section.key] })
    }
    return createWritingModule()
  })
}

export function flattenModuleTitleItems (moduleItems) {
  const flat = []
  moduleItems.forEach(module => {
    ;(module.subsections || []).forEach(sub => {
      flat.push({
        name: sub.name,
        questionItems: sub.questionItems || []
      })
    })
  })
  return flat
}

export const GAP_FILLING_TYPE = 4

export function countQuestionSlots (question) {
  if (!question) return 0
  if (Number(question.questionType) === GAP_FILLING_TYPE) {
    const items = question.items || question.questionItemObjects
    if (items && items.length > 0) {
      return items.length
    }
  }
  return 1
}

export function getSubsectionQuestionCount (subsection) {
  if (!subsection || !subsection.questionItems) return 0
  return subsection.questionItems.reduce((sum, question) => sum + countQuestionSlots(question), 0)
}

export function getModuleQuestionCount (module) {
  if (!module || !module.subsections) return 0
  return module.subsections.reduce((sum, sub) => sum + getSubsectionQuestionCount(sub), 0)
}

export function destroyModuleEditors (moduleItems) {
  ;(moduleItems || []).forEach(module => {
    ;(module.subsections || []).forEach(sub => {
      if (sub.editor) {
        sub.editor.destroy()
        sub.editor = null
      }
    })
  })
}
