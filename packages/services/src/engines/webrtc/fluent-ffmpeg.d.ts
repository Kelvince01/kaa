declare module "fluent-ffmpeg" {
  import type { EventEmitter } from "node:events";

  // biome-ignore lint/nursery/useConsistentTypeDefinitions: ignore
  interface FFmpegProgress {
    percent: number;
    timemark: string;
    currentFps: number;
    currentKbps: number;
    targetSize: number;
  }

  // biome-ignore lint/nursery/useConsistentTypeDefinitions: ignore
  interface FFmpegMetadata {
    streams: Array<{
      codec_type: string;
      width?: number;
      height?: number;
    }>;
    format: {
      duration?: string;
      bit_rate?: string;
      format_name?: string;
    };
  }

  interface FFmpegCommand extends EventEmitter {
    input(input: string | string[]): FFmpegCommand;
    output(output: string): FFmpegCommand;
    videoCodec(codec: string): FFmpegCommand;
    audioCodec(codec: string): FFmpegCommand;
    videoBitrate(bitrate: number): FFmpegCommand;
    audioBitrate(bitrate: number): FFmpegCommand;
    fps(fps: number): FFmpegCommand;
    size(size: string): FFmpegCommand;
    outputOptions(options: string[]): FFmpegCommand;
    seekInput(time: string): FFmpegCommand;
    frames(frames: number): FFmpegCommand;
    on(event: "start", listener: (commandLine: string) => void): FFmpegCommand;
    on(
      event: "progress",
      listener: (progress: FFmpegProgress) => void
    ): FFmpegCommand;
    on(event: "end", listener: () => void): FFmpegCommand;
    on(event: "error", listener: (error: Error) => void): FFmpegCommand;
    run(): void;
    static;
    ffprobe(
      input: string,
      callback: (error: Error | null, metadata: FFmpegMetadata) => void
    ): void;
  }

  // biome-ignore lint/nursery/useConsistentTypeDefinitions: ignore
  interface FFmpegStatic {
    (input?: string): FFmpegCommand;
    ffprobe(
      input: string,
      callback: (error: Error | null, metadata: FFmpegMetadata) => void
    ): void;
  }

  const ffmpeg: FFmpegStatic;
  export = ffmpeg;
  export type { ffmpeg };
}
