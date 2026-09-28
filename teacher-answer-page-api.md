# 教师端考生考卷分页与成绩报告接口说明

## 1. 分页查询所有考生考卷

```http
POST /api/teacher/examPaperAnswer/page
Content-Type: application/json
Authorization: Bearer <token>   # TEACHER 角色
```

请求主体（所有筛选字段均可选，不传即不过滤；分页字段缺省为第 1 页、每页 10 条）：

```json
{
  "pageIndex": 1,
  "pageSize": 10,
  "examPaperId": 3,
  "paperName": "剑雅",
  "userName": "张三",
  "subjectId": 2,
  "paperType": 1,
  "status": 2,
  "startTime": "2026-09-01",
  "endTime": "2026-09-30",
  "userScoreMin": "6",
  "userScoreMax": "7.5"
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `pageIndex` / `pageSize` | Integer | 分页参数，服务端兜底 1 / 10 |
| `examPaperId` | Integer | 试卷筛选：精确指定试卷 ID |
| `paperName` | String | 试卷名称模糊搜索 |
| `userName` | String | 考生筛选：模糊匹配用户名**或**真实姓名 |
| `subjectId` | Integer | 科目筛选 |
| `paperType` | Integer | 试卷类型：1 固定试卷、4 时段试卷、6 任务试卷 |
| `status` | Integer | 答卷状态：1 待批改、2 完成；不传返回全部 |
| `startTime` / `endTime` | String | 提交时间范围，支持 `yyyy-MM-dd` 与 `yyyy-MM-dd HH:mm:ss`；纯日期的 `endTime` 含当天整天 |
| `userScoreMin` / `userScoreMax` | String | 得分区间，传**显示分**（如 `6.5`），服务端换算后与库内 ×10 分值比较 |

参数非法（时间/得分格式错误、最低分大于最高分）时返回失败响应（code 非 0），`message` 会指明具体字段，如 `userScoreMin 得分格式不正确，应为数字，如 6.5`。

响应：`RestResponse<PageInfo<ExamPaperAnswerPageResponseVM>>`，`list` 元素字段：

| 字段 | 说明 |
| --- | --- |
| `id` | **答卷 ID**，进入成绩报告用 |
| `examPaperId` | 关联试卷 ID（可用于 `read/latest` 场景） |
| `userId` / `userName` / `realName` | 考生 ID、用户名、真实姓名 |
| `paperName` / `paperType` | 试卷名称、类型 |
| `subjectId` / `subjectName` | 科目 |
| `userScore` / `paperScore` / `systemScore` | 得分 / 卷面总分 / 系统评分，均为显示分字符串（如 `6.5`） |
| `questionCount` / `questionCorrect` | 题目总数、答对数 |
| `doTime` | 答题耗时（已格式化，如 `12分 30秒`） |
| `status` | 1 待批改、2 完成 |
| `createTime` | 提交时间 `yyyy-MM-dd HH:mm:ss` |

排序固定按答卷 ID 倒序（最新提交在前）。

## 2. 查看考生成绩报告

分页结果中点击某条考卷，用答卷 `id` 请求：

```http
POST /api/teacher/examPaperAnswer/read/{id}
Authorization: Bearer <token>
```

返回 `RestResponse<ExamPaperReadVM>`，结构与学生会成绩报告接口 `/api/student/exampaper/answer/read/{id}` 完全一致（`paper` + `answer`），渲染规则见 `frontend-answer-submit.md` 第 5 节。教师端不做归属限制，可查看任意考生答卷；学生端接口未做任何改动。

## 3. 前端点击链路

1. 列表页调 `POST /api/teacher/examPaperAnswer/page`，按上表渲染筛选与列。
2. 点击行 → 取该行 `id` 调 `POST /api/teacher/examPaperAnswer/read/{id}` → 进入成绩报告页。
