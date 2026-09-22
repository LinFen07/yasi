---
name: react-yasi
description: 个人 React 项目开发流程（基于 yasi-exam 项目）
---

## 触发条件

**显式触发：**
- 用户输入 `/react`
- 用户说「写一个 React 组件」「新增 Store」「添加 API」

**隐式触发：**
- 检测到操作 `.tsx`/`.ts` 文件且位于 `src/` 目录
- 检测到新建组件、新增状态管理、修改 API 等意图

---

## 输入

用户需要提供：
- **组件/Store/API 名称**：做什么的
- **状态管理需求**：是否需要连接 MobX Store
- **副作用需求**：localStorage 持久化 / API 调用 / DOM 操作
- **参考现有代码**：可选，是否有类似的组件可以参考

---

## 工作流

### 阶段1：分类判断

根据用户意图判断任务类型：

| 任务类型 | 判断条件 | 跳转阶段 |
|---------|---------|---------|
| 新增组件 | 「组件」「component」「写一个」 | 阶段2A |
| 新增 Store | 「Store」「状态」「mobx」 | 阶段2B |
| 修改代码 | 「修改」「更新」「fix」「refactor」 | 阶段2C |
| API 接口 | 「API」「接口」「请求」「fetch」 | 阶段2D |
| 工具函数 | 「工具」「helper」「utils」 | 阶段2E |

---

### 阶段2A：组件开发

**步骤：**
1. 检查是否存在相似组件（`components/basic/` 或 `components/container/`）
2. 确定组件位置：
   - `components/basic/` - 可复用题型组件（如 `tickQuestion`、`dragQuestion`）
   - `components/container/` - 布局组件（如 `answerLeft`、`answerRight`）
   - `pages/` - 页面级组件
3. 使用 `assets/component-template.tsx` 生成代码
4. 如需连接 Store：使用 `observer` 包装
5. 遵循命名规范：文件夹名/kebab-case，`index.tsx` 导出

**组件模板：**
```typescript
import { observer } from 'mobx-react';
import './index.scss';

function ComponentName() {
  return (
    <div className="component-name">
      {/* TODO */}
    </div>
  );
}

export default observer(ComponentName);
// 不需要 Store 连接时：export default ComponentName;
```

---

### 阶段2B：Store 开发

**步骤：**
1. 检查 `stores/` 是否存在相关 Store，避免重复
2. 确定 Store 职责：单一职责原则
3. 使用 MobX class 模式，包含：
   - `makeAutoObservable(this)` 初始化
   - `reaction()` 持久化（可选）
   - `loadFromLocalStorage()` / `saveToLocalStorage()` 方法
4. 单例导出：`export default new XxxStore()`
5. 在 `stores/index.ts` 中注册

**Store 模板：**
```typescript
import { makeAutoObservable, reaction } from 'mobx';

class XxxStore {
  // observable 状态
  field1: Type = defaultValue;

  constructor() {
    makeAutoObservable(this);
    this.loadFromLocalStorage();

    // 持久化（可选）
    reaction(
      () => JSON.stringify(this),
      () => this.saveToLocalStorage()
    );
  }

  saveToLocalStorage() {
    const data = { /* 要持久化的字段 */ };
    localStorage.setItem('xxxStore', JSON.stringify(data));
  }

  loadFromLocalStorage() {
    const data = localStorage.getItem('xxxStore');
    if (data) {
      const parsed = JSON.parse(data);
      // 赋值
    }
  }

  // actions
  updateField(value: Type) {
    this.field1 = value;
  }
}

export default new XxxStore();
```

---

### 阶段2C：代码修改

**步骤：**
1. 定位文件位置，使用 `grep` 找到相关代码
2. 理解现有代码逻辑和风格
3. 修改时：
   - 保持原有代码风格一致
   - 不改变未修改部分
   - 添加必要注释说明
4. 如果涉及 MobX 状态：使用 `runInAction` 包装

---

### 阶段2D：API 开发

**步骤：**
1. 检查 `api/` 是否存在相关域文件
2. 基于 `utils/request.ts` 封装
3. 按域分文件：`examPaper.ts`、`login.ts`、`studentAnswer.ts` 等
4. API 函数命名：camelCase，动词开头（`get`、`post`、`submit`）

**API 模板：**
```typescript
import request from '@/utils/request';

export const getXxxData = (params: XxxParams) => {
  return request.get('/api/xxx', { params });
};

export const submitXxxData = (data: XxxData) => {
  return request.post('/api/xxx', data);
};
```

---

### 阶段2E：工具函数开发

**步骤：**
1. 检查 `utils/helper/` 是否存在类似函数
2. 工具函数要求：
   - 纯函数，无副作用（除非明确需要）
   - 完整的 TypeScript 类型
   - 单一职责
3. 常用模式：
   - `debounce` / `throttle`
   - 数据转换（`mergeSubmitAnswers`）
   - DOM 操作（`getCorrect`）

---

### 阶段3：验收

**所有任务必须满足：**

- [ ] TypeScript 类型完整，无 `any` 滥用
- [ ] 遵循命名规范
- [ ] MobX Store 使用 class + `makeAutoObservable` 模式
- [ ] 组件使用默认导出
- [ ] 需要 Store 连接的组件用 `observer` 包装
- [ ] 异步状态更新用 `runInAction` 包装
- [ ] API 正确使用 `request` 封装
- [ ] 无反模式（参考 `references/antipatterns.md`）

---

## 兜底策略

| 情况 | 处理方式 |
|-----|---------|
| 找不到相似模式 | 询问用户：「有没有现成的组件可以参考？」 |
| 不确定任务类型 | 列出选项让用户选择 |
| 违反规范 | 警告并说明原因，询问是否继续 |
| 缺少必要信息 | 列出问题清单，逐项确认 |

---

## 验收标准

- 代码能直接使用，无需修改
- Store 包含完整的 `loadFromLocalStorage` / `saveToLocalStorage`
- 组件正确使用 `observer`（如需要）
- TypeScript 编译无错误
- 遵循项目现有的代码风格
