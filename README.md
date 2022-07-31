# multi-thead-utility

方便父线程和子线程之间调用, 对 `process.on("message")` 进行封装.

## 使用

假设子线程文件代码(_child-thread.js_)暴露出去两个方法

```typescript
import { exposeMethodsToOtherThread } from "multi-thread-utility";

exposeMethodsToOtherThread(process, {
  hello(name) {
    return `Hello ${name}.`;
  },
  exit(code) { // 用于父线程告诉子线退出
    process.exit(code);
  },
});
```

然后父线程使用以下代码调用子线程暴露的方法:

```typescript
const { invoke, thread } = invokeChildThreadMethods<{
  // 注意代理的子线程所有方法返回的都是Promise对象
  hello(name: string): Promise<string>
  exit(code: number): Promise<void>
}>({
  module: path.join(__dirname, "child-thread.js"), // 子线程文件
});
const val = await invoke.hello("Alan");
expect(val).toBe("Hello Alan.");
invoke.exit(0);
```
