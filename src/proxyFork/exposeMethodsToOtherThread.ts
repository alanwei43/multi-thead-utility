import { ChildProcess } from "child_process";
import { InvokeMethod } from "./InvokeMethod";
import { MethodResult } from "./MethodResult";
import { isInvalidId } from "./isInvalidId";
import { autoExitChildProcess } from "./autoExitChildProcess";

/**
 * 暴露方法给其他线程(子线程或者父线程)
 * @param methods 方法列表(一般是class实例)
 * @param thread 线程对象: 如果自身是子线程, 暴露方法给父线程, 传Node全局对象process; 如果自身是父线程，暴露方法给子线程, 传子线程对象.
 * @param options
 */

export function exposeMethodsToOtherThread<T>(
  thread: NodeJS.Process | ChildProcess,
  methods: T,
  options: { context?: any; } = {}): void {
  thread.on("message", function (rawRequest: string | InvokeMethod) {
    /**
     * 接收父线程发送的方法调用请求
     */
    const isJsonFormat = typeof rawRequest === "string";
    const invoke: InvokeMethod = isJsonFormat ? JSON.parse(rawRequest + "") : rawRequest;
    if (isInvalidId(invoke.id)) {
      console.warn(`invalid invoke id: ${invoke.id}`);
      return;
    }
    if (invoke.type !== "invoke") {
      // console.warn(`invalid invoke type: ${invoke.type}`);
      return;
    }

    // @ts-ignore
    const fn: Function = methods[invoke.method];
    if (typeof fn !== "function") {
      console.log(`${invoke.method} is not a function`);
      const response: MethodResult = {
        type: "result",
        id: invoke.id,
        result: undefined,
        error: `${invoke.method} is not a function`
      };
      thread.send && thread.send(isJsonFormat ? JSON.stringify(response) : response);
      return;
    }

    /**
     * 执行方法调用并返回给发起调用请求的线程
     */
    const result = fn.apply(options.context || methods, invoke.args);
    Promise.resolve(result).then(data => {
      const result: MethodResult = {
        type: "result",
        id: invoke.id,
        result: data,
        error: undefined
      };
      /**
       * 将方法执行结果返回给发起调用请求的线程
       */
      thread.send && thread.send(isJsonFormat ? JSON.stringify(result) : result);
    });
  });
  autoExitChildProcess(thread as ChildProcess);
}
