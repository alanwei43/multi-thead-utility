import { INVOKE_ID_PREFIX } from "./consts";

export function isInvalidId(id: string): boolean {
  return typeof id !== "string" || !id.startsWith(INVOKE_ID_PREFIX);
}
