# 反模式警告

本文档列出项目中应该避免的模式，AI 生成代码时必须检查并避免。

---

## 1. MobX 相关

### ❌ 不要：直接修改 observable 而不在 action 中

```typescript
// 错误
this.name = 'new name';

// 正确 - 在 action 或 runInAction 中
runInAction(() => {
  this.name = 'new name';
});
```

### ❌ 不要：在 constructor 中直接调用 async 方法

```typescript
// 错误
constructor() {
  makeAutoObservable(this);
  this.fetchData();  // 不要这样
}

// 正确
constructor() {
  makeAutoObservable(this);
}
```

### ❌ 不要：使用 `@observable` 装饰器（使用 makeAutoObservable）

```typescript
// 错误
@observable name = 'test';

// 正确
class Store {
  name = 'test';  // 直接定义
  constructor() {
    makeAutoObservable(this);
  }
}
```

---

## 2. React 组件相关

### ❌ 不要：不必要的 observer 包裹

```typescript
// 错误 - 组件不依赖任何 store
function PureComponent() {
  return <div>Hello</div>;
}
export default observer(PureComponent);  // 不需要

// 正确
function PureComponent() {
  return <div>Hello</div>;
}
export default PureComponent;
```

### ❌ 不要：在 JSX 中直接使用 index 作为 key

```typescript
// 错误
{items.map((item, index) => (
  <div key={index}>...</div>
))}

// 正确 - 使用唯一 ID
{items.map((item) => (
  <div key={item.id}>...</div>
))}
```

### ❌ 不要：在 useEffect 依赖数组中使用对象/数组

```typescript
// 错误
useEffect(() => {
  doSomething(obj);
}, [obj]);  // obj 每次渲染都是新引用

// 正确
useEffect(() => {
  doSomething(obj);
}, [obj.id]);  // 使用稳定的基础类型
```

---

## 3. TypeScript 相关

### ❌ 不要：滥用 any

```typescript
// 错误
function handle(data: any) {
  console.log(data.foo);
}

// 正确 - 使用 unknown 或具体类型
function handle(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // 处理
  }
}
// 或使用具体类型
function handle(data: SpecificType) {
  console.log(data.foo);
}
```

### ❌ 不要：忽略 TypeScript 错误

```typescript
// 错误
// @ts-ignore
const value = something;

// 正确 - 定义正确类型
const value: ExpectedType = something;
```

### ❌ 不要：函数参数不定义类型

```typescript
// 错误
function handle(data) {
  // ...
}

// 正确
function handle(data: DataType) {
  // ...
}
```

---

## 4. API 相关

### ❌ 不要：直接在组件中调用 API

```typescript
// 错误
function Component() {
  const [data, setData] = useState();
  useEffect(() => {
    fetch('/api/data').then(res => setData(res));  // 不要这样
  }, []);
}

// 正确 - 通过 Store 或 hook 封装
function Component() {
  const data = stores.ExamStore.examData;  // Store 管理
}
```

### ❌ 不要：API 不处理错误

```typescript
// 错误
const fetchData = async () => {
  const res = await request.get('/api/data');
  return res;
};

// 正确 - 统一错误处理或明确错误边界
const fetchData = async () => {
  try {
    const res = await request.get('/api/data');
    return res;
  } catch (error) {
    // 明确处理或抛出
    throw error;
  }
};
```

---

## 5. 性能相关

### ❌ 不要：在 render 中创建新函数/对象

```typescript
// 错误
function Component({ items }) {
  return (
    <div>
      {items.map(item => (
        <button onClick={() => handleClick(item)}>...</button>
      ))}
    </div>
  );
}

// 正确 - 使用 useCallback 或直接传递 item
function Component({ items }) {
  const handleClick = useCallback((item) => {
    // ...
  }, []);

  return (
    <div>
      {items.map(item => (
        <button onClick={() => handleClick(item)}>...</button>
      ))}
    </div>
  );
}
```

### ❌ 不要：频繁触发 localStorage 写入

```typescript
// 错误 - 每次状态变化都写入
reaction(
  () => this.someField,
  () => this.saveToLocalStorage()
);

// 正确 - 使用 debounce 合并写入
const debouncedSave = debounce(() => this.saveToLocalStorage(), 500);
reaction(
  () => this.someField,
  () => debouncedSave()
);
```

---

## 6. 命名相关

### ❌ 不要：中英混用

```typescript
// 错误
const 数据 = 'test';
const get数据 = () => {};

// 正确
const data = 'test';
const getData = () => {};
```

### ❌ 不要：无意义的缩写

```typescript
// 错误
const usr = 'user';
const getUsrData = () => {};

// 正确
const user = 'user';
const getUserData = () => {};
```

### ❌ 不要：使用拼音命名

```typescript
// 错误
const tijiao = () => {};
const xuanzeti = () => {};

// 正确
const submit = () => {};
const selectQuestion = () => {};
```

---

## 7. 代码组织相关

### ❌ 不要：一个文件做太多事情

```typescript
// 错误 - 一个组件包含所有逻辑
function BigComponent() {
  // 1000 行
}

// 正确 - 拆分组件
function BigComponent() {
  return (
    <div>
      <Header />
      <Content />
      <Footer />
    </div>
  );
}
```

### ❌ 不要：Magic Numbers

```typescript
// 错误
if (status === 1) { ... }

// 正确
const EXAM_STATUS = {
  NOT_STARTED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
} as const;
if (status === EXAM_STATUS.IN_PROGRESS) { ... }
```

---

## 8. 检查清单

生成代码后自检：
- [ ] 无 `any` 滥用
- [ ] observer 仅包裹需要 MobX 的组件
- [ ] 异步状态更新在 `runInAction` 中
- [ ] API 错误有处理
- [ ] 变量命名无中英混用
- [ ] 无 magic numbers
- [ ] localStorage 写入有 debounce
