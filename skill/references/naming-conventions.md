# 命名规范

本文档定义项目中所有命名规则，保持一致性。

---

## 1. 文件命名

### 组件文件

| 类型 | 规则 | 示例 |
|-----|------|------|
| 组件文件夹 | kebab-case | `tick-question/` |
| 组件入口文件 | `index.tsx` | `tick-question/index.tsx` |
| 组件样式文件 | `index.scss` | `tick-question/index.scss` |

### 非组件文件

| 类型 | 规则 | 示例 |
|-----|------|------|
| TypeScript 文件 | camelCase | `examPaper.ts` |
| 工具函数文件 | camelCase | `mergeSubmitAnswers.ts` |
| 类型定义文件 | kebab-case | `router.d.ts` |

---

## 2. 代码命名

### 变量和函数

| 类型 | 规则 | 示例 |
|-----|------|------|
| 普通变量 | camelCase | `paperId`, `currentIndex` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 函数 | camelCase，动词开头 | `getExamPaper()`, `submitAnswer()` |
| 布尔变量 | is/has/can 前缀 | `isReady`, `hasError`, `canSubmit` |

### 类名和类型

| 类型 | 规则 | 示例 |
|-----|------|------|
| 类名 | PascalCase | `class ExamStore` |
| 接口类型 | PascalCase，末尾加类型 | `ExamPaper`, `SubmitAnswerItem` |
| Type 类型 | PascalCase | `type QuestionMap = Record<string, Question>` |

### React 组件

| 类型 | 规则 | 示例 |
|-----|------|------|
| 组件名 | PascalCase | `function ExamPage()` |
| 组件文件名 | 文件夹名/index.tsx | `examPage/index.tsx` |
| 组件导出 | 默认导出 | `export default ExamPage` |

### MobX Store

| 类型 | 规则 | 示例 |
|-----|------|------|
| Store 类名 | PascalCase，Store 结尾 | `class ExamStore` |
| Store 实例 | camelCase | `export default new ExamStore()` |
| Observable 字段 | camelCase | `paperId`, `studentAnswers` |
| Action 方法 | camelCase，动词开头 | `changePaperId()`, `addExam()` |

---

## 3. 目录命名

| 目录 | 规则 | 示例 |
|-----|------|------|
| 组件目录 | kebab-case | `components/basic/tick-question/` |
| 页面目录 | kebab-case | `pages/exam-page/` |
| API 目录 | 不单独命名，文件区分 | `api/examPaper.ts` |
| 工具目录 | 不单独命名，文件区分 | `utils/helper/` |

---

## 4. CSS 类名

| 类型 | 规则 | 示例 |
|-----|------|------|
| 组件样式类 | kebab-case，与组件名对应 | `.exam-content`, `.answer-box` |
| 私有类（仅组件内用） | 下划线开头 | `._internal-wrapper` |

---

## 5. API 命名

| 类型 | 规则 | 示例 |
|-----|------|------|
| API 函数 | camelCase，动词开头 | `getExamPaper`, `submitAnswer` |
| API 文件 | camelCase，域名词 | `examPaper.ts`, `studentAnswer.ts` |
| URL 路径 | kebab-case | `/api/exam-paper`, `/api/student-answer` |

---

## 6. 命名冲突处理

当命名冲突时：
1. 优先使用描述性更强的名称
2. Store 属性可以加前缀（`examStore.paperId` vs `answerStore.paperId`）
3. 避免无意义的缩写

---

## 7. 命名检查清单

生成代码时检查：
- [ ] 文件名与内容匹配
- [ ] 组件名与文件名一致
- [ ] Store 方法命名一致
- [ ] 无拼写错误
- [ ] 无中英混用
