import Image, { type ImageProps } from "next/image";
import type React from "react";

/**
 * OptimizedImage component that uses Next.js Image for automatic optimization
 * Provides image optimization, lazy loading, and responsive sizing
 */
interface OptimizedImageProps extends Omit<ImageProps, "layout"> {
  layout?: "fixed" | "intrinsic" | "responsive" | "fill";
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  className?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  layout = "responsive",
  objectFit = "cover",
  quality = 75,
  priority = false,
  className = "",
  placeholder = "blur",
  blurDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  sizes,
  ...rest
}) => {
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        alt={alt || "Image"}
        blurDataURL={blurDataURL}
        height={height} // Type assertion needed due to Next.js Image component updates
        layout={layout}
        objectFit={objectFit}
        placeholder={placeholder}
        priority={priority}
        quality={quality}
        sizes={sizes}
        src={src}
        width={width}
        {...rest}
      />
    </div>
  );
};

export default OptimizedImage;
