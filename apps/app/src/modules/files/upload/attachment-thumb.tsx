// import { config } from "@kaa/config";
import type React from "react";
import { useMemo } from "react";
import { useLocalFile } from "@/modules/files/hooks/use-local-file";
import FilePlaceholder from "@/modules/files/upload/file-placeholder";

type AttachmentThumbProps = {
  url: string;
  contentType: string;
  name: string;
};

const AttachmentThumb: React.FC<AttachmentThumbProps> = ({
  url: baseUrl,
  contentType,
  name,
}) => {
  const { localUrl } = useLocalFile(baseUrl, contentType);

  // Use either remote URL or local URL
  const url = useMemo(() => {
    // if (baseUrl.startsWith(config.publicCDNUrl))
    if (baseUrl.startsWith("https://"))
      return `${baseUrl}?width=100&format=avif`;
    if (baseUrl.startsWith("/static/")) return baseUrl;

    return localUrl.length ? localUrl : null;
  }, [baseUrl, localUrl]);

  return url && contentType.includes("image") ? (
    // biome-ignore lint/performance/noImgElement: by author
    <img
      alt={name}
      className="h-8 w-8 rounded-md bg-muted object-cover"
      decoding="async"
      draggable="false"
      height={32}
      loading="lazy"
      src={url}
      width={32}
    />
  ) : (
    <FilePlaceholder contentType={contentType} />
  );
};

export default AttachmentThumb;
