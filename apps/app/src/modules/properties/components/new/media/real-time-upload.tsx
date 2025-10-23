"use client";

import { useEffect, useRef, useState } from "react";

export type RealTimeUploadConfig = {
  endpoint: string;
  chunkSize: number;
  maxRetries: number;
  enableWebSocket?: boolean;
};

export type UploadStatus = {
  id: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "failed" | "paused";
  speed?: number;
  timeRemaining?: number;
  error?: string;
};

export function useRealTimeUpload(config: RealTimeUploadConfig) {
  const [uploads, setUploads] = useState<Map<string, UploadStatus>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!config.enableWebSocket) return;

    const ws = new WebSocket(
      `${config.endpoint.replace("http", "ws")}/upload-progress`
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "upload-progress") {
        setUploads((prev) => {
          const updated = new Map(prev);
          updated.set(data.uploadId, {
            ...updated.get(data.uploadId),
            ...data.status,
          });
          return updated;
        });
      }
    };

    return () => ws.close();
  }, [config.endpoint, config.enableWebSocket]);

  const uploadFile = async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const uploadId = `upload-${Date.now()}-${Math.random()}`;
    const controller = new AbortController();
    abortControllers.current.set(uploadId, controller);

    // Initialize upload status
    setUploads(
      (prev) =>
        new Map(
          prev.set(uploadId, {
            id: uploadId,
            progress: 0,
            status: "pending",
          })
        )
    );

    try {
      // Chunked upload implementation
      const chunks = Math.ceil(file.size / config.chunkSize);
      let uploadedBytes = 0;
      const startTime = Date.now();

      for (let i = 0; i < chunks; i++) {
        const start = i * config.chunkSize;
        const end = Math.min(start + config.chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("uploadId", uploadId);
        formData.append("chunkIndex", i.toString());
        formData.append("totalChunks", chunks.toString());
        formData.append("fileName", file.name);

        let retries = 0;
        while (retries < config.maxRetries) {
          try {
            await fetch(`${config.endpoint}/upload-chunk`, {
              method: "POST",
              body: formData,
              signal: controller.signal,
            });
            break;
          } catch (error) {
            retries++;
            if (retries === config.maxRetries) throw error;
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
          }
        }

        uploadedBytes += chunk.size;
        const progress = (uploadedBytes / file.size) * 100;
        const elapsed = Date.now() - startTime;
        const speed = uploadedBytes / (elapsed / 1000); // bytes per second
        const timeRemaining = (file.size - uploadedBytes) / speed;

        const status: UploadStatus = {
          id: uploadId,
          progress,
          status: "uploading",
          speed,
          timeRemaining,
        };

        setUploads((prev) => new Map(prev.set(uploadId, status)));
        onProgress?.(progress);
      }

      // Finalize upload
      const finalizeResponse = await fetch(
        `${config.endpoint}/finalize-upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, fileName: file.name }),
          signal: controller.signal,
        }
      );

      const result = await finalizeResponse.json();

      setUploads(
        (prev) =>
          new Map(
            prev.set(uploadId, {
              id: uploadId,
              progress: 100,
              status: "completed",
            })
          )
      );

      abortControllers.current.delete(uploadId);
      return result.url;
    } catch (error) {
      setUploads(
        (prev) =>
          new Map(
            prev.set(uploadId, {
              id: uploadId,
              progress: 0,
              status: "failed",
              error: error instanceof Error ? error.message : "Upload failed",
            })
          )
      );
      throw error;
    }
  };

  const pauseUpload = (uploadId: string) => {
    const controller = abortControllers.current.get(uploadId);
    controller?.abort();
    setUploads((prev) => {
      const updated = new Map(prev);
      const current = updated.get(uploadId);
      if (current) {
        updated.set(uploadId, { ...current, status: "paused" });
      }
      return updated;
    });
  };

  const resumeUpload = async (uploadId: string, _file: File) => {
    // Implementation for resuming upload from last successful chunk
    const current = uploads.get(uploadId);
    if (!current) return;

    // Get last successful chunk from server
    const response = await fetch(
      `${config.endpoint}/upload-status/${uploadId}`
    );
    const { lastChunk } = await response.json();

    // Continue from where we left off
    // Implementation continues...
  };

  const cancelUpload = (uploadId: string) => {
    const controller = abortControllers.current.get(uploadId);
    controller?.abort();
    abortControllers.current.delete(uploadId);
    setUploads((prev) => {
      const updated = new Map(prev);
      updated.delete(uploadId);
      return updated;
    });
  };

  return {
    uploads: Array.from(uploads.values()),
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
  };
}
