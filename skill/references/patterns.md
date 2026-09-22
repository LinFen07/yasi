# 代码模式库

本文档记录项目中确认使用的代码模式，AI 在生成代码时必须遵循。

---

## 1. MobX Store 模式

### 标准 Store 结构

```typescript
import { makeAutoObservable, reaction, runInAction } from 'mobx';

class ExamStore {
  // ============ Observable 状态 ============
  paperId = 0;
  currentExamIndex = 1;
  exam: Array<Exam> = [];

  // ============ 私有状态 ============
  private streamCheckPromises = new Map<number, Promise<boolean>>();

  // ============ Constructor ============
  constructor() {
    makeAutoObservable(this);
    this.loadFromLocalStorage();

    // 持久化（可选，根据需要）
    reaction(
      () => JSON.stringify(this),
      () => this.saveToLocalStorage()
    );
  }

  // ============ 持久化方法 ============
  saveToLocalStorage() {
    const data = {
      paperId: this.paperId,
      currentExamIndex: this.currentExamIndex,
      exam: this.exam,
      // 只持久化必要的字段
    };
    localStorage.setItem('examStore', JSON.stringify(data));
  }

  loadFromLocalStorage() {
    const data = localStorage.getItem('examStore');
    if (data) {
      const parsed = JSON.parse(data);
      this.paperId = parsed.paperId || 0;
      // ... 其他字段
    }
  }

  // ============ Actions ============
  changePaperId(id: number) {
    this.paperId = id;
  }

  // ============ Async Actions ============
  async checkStreamAvailable(paperId: number): Promise<boolean> {
    // Promise 缓存避免重复请求
    const existing = this.streamCheckPromises.get(paperId);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const res = await fetch(url, { headers: { Range: 'bytes=0-0' } });
        const ok = res.ok || res.status === 206;

        runInAction(() => {
          this.audioStreamReadyMap[paperId] = ok;
        });
        return ok;
      } finally {
        this.streamCheckPromises.delete(paperId);
      }
    })();

    this.streamCheckPromises.set(paperId, promise);
    return promise;
  }
}

export default new ExamStore();  // 单例导出
```

### Store 注册

在 `stores/index.ts` 中：

```typescript
import examStore from './exam';
import answerStore from './answer';
import userStore from './user';

export default {
  ExamStore: examStore,
  AnswerStore: answerStore,
  UserStore: userStore,
};

// 或分别导出
export { examStore, answerStore, userStore };
```

---

## 2. 组件模式

### 普通组件

```typescript
import './index.scss';

function ComponentName() {
  return (
    <div className="component-name">
      {/* content */}
    </div>
  );
}

export default ComponentName;
```

### 需要连接 Store 的组件

```typescript
import { observer } from 'mobx-react';
import stores from '@/stores';

function ComponentName() {
  const value = stores.ExamStore.someField;

  return (
    <div className="component-name">
      {value}
    </div>
  );
}

export default observer(ComponentName);
```

### 组件内使用 runInAction

```typescript
import { runInAction } from 'mobx';

// 在异步回调中更新状态
const handleAsync = async () => {
  const data = await fetchData();
  runInAction(() => {
    stores.ExamStore.updateField(data);
  });
};
```

---

## 3. API 层模式

### request.ts 封装

```typescript
import axios from 'axios';

const request = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器：添加 token
request.interceptors.request.use((config) => {
  if (UserStore.token) {
    config.headers.set('Authorization', `Bearer ${UserStore.token}`);
  }
  return config;
});

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 统一错误处理
    return Promise.reject(error);
  }
);

export default request;
```

### API 文件结构

```typescript
// api/examPaper.ts
import request from '@/utils/request';

export const getExamPaper = (paperId: number) => {
  return request.get(`/exam/paper/${paperId}`);
};

export const getStreamAudioUrl = (paperId: number): string => {
  return `${process.env.API_BASE_URL}/audio/stream/${paperId}`;
};
```

---

## 4. 草稿分离存储模式

用于处理输入框内容和 Store 答案的分离存储：

```typescript
// 保存答案到 Store
stores.AnswerStore.changeAnswer(index, {
  questionId: id,
  content: value,
  prefix: '1',
});

// 同时保存草稿到 localStorage（实时性更高）
localStorage.setItem(
  `answer-input-${paperId}-${questionIndex}`,
  value
);

// 提交时合并
const draft = localStorage.getItem(`answer-input-${paperId}-${questionIndex}`);
const finalValue = draft || storeValue;
```

---

## 5. 策略模式 - 题型分发

```typescript
{questionsArr.map((question, index) => (
  <div key={index}>
    {question.topicType === '5' ? (
      <TickQuestion {...question} exam={exam} />
    ) : question.topicType === '6' ? (
      <DragQuestion {...question} exam={exam} />
    ) : question.topicType === '4' ? (
      <div>{parse(cleanQuestionContent(question.title))}</div>
    ) : (
      <Radio.Group onChange={onChange(index)} value={...} />
    )}
  </div>
))}
```

---

## 6. Debounce 防抖

```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}
```

---

## 7. HTTP Range 探测

```typescript
async checkListenStreamAvailable(paperId: number): Promise<boolean> {
  // 1. 检查缓存
  if (this.audioStreamReadyMap[paperId]) return true;

  // 2. 检查进行中的请求
  const existing = this.streamCheckPromises.get(paperId);
  if (existing) return existing;

  // 3. 发起 Range 探测
  const promise = (async () => {
    const res = await fetch(url, { headers: { Range: 'bytes=0-0' } });
    const ok = res.ok || res.status === 206;  // 兼容返回 200 的服务器
    return ok;
  })();

  this.streamCheckPromises.set(paperId, promise);
  return promise;
}
```

---

## 8. React Hooks 模式

```typescript
// hooks/core/useEventListener.ts
import { useEffect } from 'react';

export function useEventListener(
  eventType: string,
  handler: (event: Event) => void,
  element: Window | Document | HTMLElement = window
) {
  useEffect(() => {
    element.addEventListener(eventType, handler);
    return () => element.removeEventListener(eventType, handler);
  }, [eventType, handler, element]);
}
```
