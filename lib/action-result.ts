export type ActionResult<T = undefined> =
  | ({ ok: true; message: string } & (T extends undefined ? Record<string, never> : T))
  | { ok: false; message: string };

export function actionSuccess<T extends object = Record<string, never>>(message: string, data?: T): ActionResult<T> {
  return { ok: true, message, ...(data ?? {}) } as ActionResult<T>;
}

export function actionFailure(message: string): ActionResult {
  return { ok: false, message };
}
