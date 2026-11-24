import type { DropTableFixture } from "@hiperxp/contracts";
import type { SimulateResult } from "@hiperxp/drop-engine";
import type { WorkerRequest, WorkerResponse } from "../workers/simulate.worker";

export type SimulateClientHandle = {
  promise: Promise<SimulateResult>;
  cancel: () => void;
};

export function runSimulationInWorker(input: {
  table: DropTableFixture;
  count: number;
  seed?: string;
  onProgress?: (processed: number, requested: number) => void;
}): SimulateClientHandle {
  const worker = new Worker(
    new URL("../workers/simulate.worker.ts", import.meta.url),
    { type: "module" },
  );
  const requestId = crypto.randomUUID();

  const promise = new Promise<SimulateResult>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.requestId !== requestId) return;

      if (message.type === "progress") {
        input.onProgress?.(message.processed, message.requested);
        return;
      }

      if (message.type === "done") {
        worker.terminate();
        resolve(message.result);
        return;
      }

      if (message.type === "error") {
        worker.terminate();
        reject(new Error(message.message));
      }
    };

    worker.onerror = (event) => {
      worker.terminate();
      reject(event.error ?? new Error(event.message));
    };

    const request: WorkerRequest = {
      type: "run",
      requestId,
      table: input.table,
      count: input.count,
      seed: input.seed,
    };
    worker.postMessage(request);
  });

  return {
    promise,
    cancel: () => {
      const cancel: WorkerRequest = { type: "cancel", requestId };
      worker.postMessage(cancel);
    },
  };
}
