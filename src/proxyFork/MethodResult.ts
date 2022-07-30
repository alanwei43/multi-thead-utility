/**
 * 方法响应结果
 */
export interface MethodResult {
  type: "result";
  id: string;

  result: any;
  error?: string;
}
