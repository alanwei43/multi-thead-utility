import { ChildProcess } from "child_process";

export function autoExitChildProcess(thread: ChildProcess) {
  if (process.pid !== thread.pid) {
    // 检测到不是当前线程
    process.on("exit", () => {
      thread.kill();
    });
    process.on("SIGINT", () => {
      thread.kill("SIGINT");
      process.exit(0);
    });

  }
}
