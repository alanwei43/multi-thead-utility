import path from "path";
import { invokeChildThreadMethods } from "../invokeChildThreadMethods";

describe("Parent thread invoke child thread method", () => {
  test("call exist method", async () => {
    const { invoke, thread } = invokeChildThreadMethods<{
      hello(name: string): Promise<string>
      exit(code: number): void
    }>({
      "module": path.join(__dirname, "child-thread.js"),
    });
    const val = await invoke.hello("Alan");
    expect(val).toBe("Hello Alan.");
    invoke.exit(0);
  });
  test("call not exist method", async () => {
    const { invoke, thread } = invokeChildThreadMethods<{
      notExit(name: string): Promise<string>
      exit(code: number): void
    }>({
      "module": path.join(__dirname, "child-thread.js"),
    });
    try {
      await invoke.notExit("Alan");
    } catch (ex: any) {
      expect(ex.message).toBe('notExit is not a function');
    }
    invoke.exit(0);
  });
  test("timeout", async () => {
    const { invoke, thread } = invokeChildThreadMethods<{
      delay(val: string, ts: number): Promise<string>
      exit(code: number): void
    }>({
      "module": path.join(__dirname, "child-thread.js"),
    }, {
      "timeout": 500
    });
    const val = await invoke.delay("hello", 200);
    expect(val).toBe("hello");
    try {
      await invoke.delay("execute tiemout", 1000);
    } catch (ex: any) {
      expect(ex.message).toBe("time out");
    }
    invoke.exit(0);
  });
})