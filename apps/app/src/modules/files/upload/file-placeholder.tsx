import { File, FileAudio, FileImage, FileText, FileVideo } from "lucide-react";

type Props = {
  contentType: string | undefined;
  iconSize?: number;
  strokeWidth?: number;
  className?: string;
};

const FilePlaceholder = ({
  contentType,
  iconSize = 20,
  strokeWidth = 1.5,
  className,
}: Props) => {
  if (!contentType) return <File size={iconSize} />;
  if (contentType.includes("image"))
    return (
      <FileImage
        className={className}
        size={iconSize}
        strokeWidth={strokeWidth}
      />
    );
  if (contentType.includes("video"))
    return (
      <FileVideo
        className={className}
        size={iconSize}
        strokeWidth={strokeWidth}
      />
    );
  if (contentType.includes("pdf"))
    return (
      <FileText
        className={className}
        size={iconSize}
        strokeWidth={strokeWidth}
      />
    );
  if (contentType.includes("audio"))
    return (
      <FileAudio
        className={className}
        size={iconSize}
        strokeWidth={strokeWidth}
      />
    );
  return <File size={iconSize} />;
};

export default FilePlaceholder;
