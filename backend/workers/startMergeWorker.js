import { Worker } from "worker_threads";



export const startMergeWorker = () => {
  const worker = new Worker(
    new URL("../workers/mergeInstruments.worker.js", import.meta.url)
  );

  worker.on("message", (msg) => {
    console.log("Worker:", msg);
  });

  worker.on("error", console.error);
};