/**
 * 请求调用方法
 */
export interface InvokeMethod {
  type: "invoke";
  id: string;
  method: string;
  args: Array<any>;
}
