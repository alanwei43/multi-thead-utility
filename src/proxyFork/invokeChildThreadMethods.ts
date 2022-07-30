import { ChildProcess, fork, ForkOptions } from "child_process";
import { proxyOtherThreadMethods } from "./proxyOtherThreadMethods";
import { InvokeProxyOptions } from "./InvokeProxyOptions";

/**
 * fork创建子线程并调用子线程方法
 * @param forkOpts
 * @param proxyOpts
 */
export function invokeChildThreadMethods<T>(
  forkOpts: {
    module: string;
    args?: Array<string>;
    options?: ForkOptions;
  },
  proxyOpts?: InvokeProxyOptions
): { invoke: T; thread: ChildProcess; } {
  if (!forkOpts.options) {
    forkOpts.options = {};
  }
  if (!forkOpts.options.cwd) {
    forkOpts.options.cwd = process.cwd();
  }
  if (!forkOpts.options.env) {
    forkOpts.options.env = process.env;
  }
  const cp: ChildProcess = fork(forkOpts.module, forkOpts.args, forkOpts.options);
  return {
    invoke: proxyOtherThreadMethods(cp, proxyOpts || {}),
    thread: cp
  };
}
