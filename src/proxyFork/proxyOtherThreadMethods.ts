import { ChildProcess } from "child_process";
import { getRandomStr } from "../random";
import { InvokeMethod } from "./InvokeMethod";
import { InvokeProxyOptions } from "./InvokeProxyOptions";
import { MethodResult } from "./MethodResult";
import { INVOKE_ID_PREFIX } from "./consts";
import { isInvalidId } from "./isInvalidId";
import { autoExitChildProcess } from "./autoExitChildProcess";

/**
 * 代理其他线程暴露的方法(通过 exposeMethodsToOtherThread 方法暴露), 需要注意的是最终代理的方法都是异步的, 返回的是个Promise
 * @param thread 其他线程对象: 如果自身是子线程, 需要代理调用父线程方法, 传Node全局对象 process; 如果自身是父线程, 需要代理调用子线程方法, 传子线程对象.
 * @param proxyOpts 代理选项
 */

export function proxyOtherThreadMethods<T>(
  thread: NodeJS.Process | ChildProcess,
  proxyOpts: InvokeProxyOptions
): T {
  const invokeCallbacks: Map<string, { resolve: Function; reject: Function; }> = new Map();
  /**
   * 接收方法返回结果
   */
  thread.on("message", function (rawResponse: string | MethodResult) {
    const result: MethodResult = typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;
    if (isInvalidId(result.id)) {
      console.warn(`result id(${result.id}) is not a string`);
      return;
    }
    if (result.type !== "result") {
      return;
    }

    const callback = invokeCallbacks.get(result.id);
    if (callback) {
      invokeCallbacks.delete(result.id);
      result.error ? callback.reject(new Error(result.error)) : callback.resolve(result.result);
    } else {
      console.warn(`${result.id} not found callback`);
    }
  });

  const ThreadStatus = {
    pid: thread.pid,
    exitCode: undefined,
    exitSignal: ""
  };
  thread.on("exit", function (number, signal) {
    ThreadStatus.exitCode = number;
    ThreadStatus.exitSignal = signal;
  });

  autoExitChildProcess(thread as ChildProcess);

  /**
   * 返回一个代理对象, 处理用户的方法调用请求
   */
  const instance = {};
  const proxy = new Proxy(instance, {
    apply(target, thisArg, args) {
      throw new Error("不支持new实例化");
    },
    get(target, property, receiver) {

      const id = INVOKE_ID_PREFIX + getRandomStr();
      return function (...args: any[]) {

        const invoke: InvokeMethod = {
          type: "invoke",
          method: String(property),
          id: id,
          args: args
        };

        return new Promise((resolve, reject) => {
          if (typeof ThreadStatus.exitCode === "number") {
            reject(new Error(`process(${ThreadStatus.pid}) has exit, code: ${ThreadStatus.exitCode}, signal: ${ThreadStatus.exitSignal}`));
            return;
          }
          const sendData = proxyOpts.json === false ? invoke : JSON.stringify(invoke);
          thread.send && thread.send(sendData, err => {
            err && reject(err);
          });
          invokeCallbacks.set(id, {
            resolve: (data: any) => resolve(data),
            reject: (err: Error) => reject(err)
          });
          if (typeof proxyOpts.timeout === "number") {
            /**
             * 如果用户设置了超时
             */
            setTimeout(() => {
              invokeCallbacks.delete(id);
              reject(new Error("time out"));
            }, proxyOpts.timeout);
          }
        });
      };
    }
  });
  return proxy as T;
}
