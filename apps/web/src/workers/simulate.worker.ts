import type { DropTableFixture } from "@hiperxp/contracts";
import { simulate, type SimulateResult } from "@hiperxp/drop-engine";

export type WorkerRequest =
  | {
      type: "run";
      requestId: string;
      table: DropTableFixture;
      count: number;
      seed?: string;
    }
  | { type: "cancel"; requestId: string };

export type WorkerResponse =
  | {
      type: "progress";
      requestId: string;
      processed: number;
      requested: number;
    }
  | { type: "done"; requestId: string; result: SimulateResult }
  | { type: "error"; requestId: string; message: string };

const controllers = new Map<string, AbortController>();

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  if (message.type === "cancel") {
    controllers.get(message.requestId)?.abort();
    return;
  }

  if (message.type !== "run") return;

  const controller = new AbortController();
  controllers.set(message.requestId, controller);

  try {
    const result = simulate(message.table, {
      count: message.count,
      seed: message.seed,
      signal: controller.signal,
      progressEvery: Math.max(1, Math.floor(message.count / 40) || 1),
      onProgress: ({ processed, requested }) => {
        const progress: WorkerResponse = {
          type: "progress",
          requestId: message.requestId,
          processed,
          requested,
        };
        self.postMessage(progress);
      },
    });
    const done: WorkerResponse = {
      type: "done",
      requestId: message.requestId,
      result,
    };
    self.postMessage(done);
  } catch (error) {
    const err: WorkerResponse = {
      type: "error",
      requestId: message.requestId,
      message: error instanceof Error ? error.message : "simulation failed",
    };
    self.postMessage(err);
  } finally {
    controllers.delete(message.requestId);
  }
};
