declare module "expo-task-manager" {
  export type TaskManagerError = { message: string; code?: string };
  export type TaskManagerTaskBody<T> = { data: T; error: TaskManagerError | null; executionInfo: unknown };
  export function defineTask<T = unknown>(taskName: string, taskExecutor: (body: TaskManagerTaskBody<T>) => Promise<void> | void): void;
}
