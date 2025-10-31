import type React from "react";
import { useEffect, useRef, useState } from "react";
import Button from "../editor/components/ui/Button";
import MediaGallery, { type ImageData } from "./MediaGallery";

import "./style.scss";

const defaultImages: ImageData[] = [
  {
    url: "https://ssl.cdn-redfin.com/photo/rent/124d0781-6aff-49f4-b8c6-5e64e5ec47a1/islphoto/genIsl.0_2.webp",
    format: "image/png",
    display_name: "Test image",
    width: 100,
    height: 100,
  },
];

type MediaLibraryProps = {
  onInsert?: (image: ImageData) => void;
  onClose?: () => void;
};

const MediaLibrary: React.FC<MediaLibraryProps> = ({ onInsert, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<ImageData[]>(defaultImages);
  const [previews, setPreviews] = useState<ImageData[]>([]);
  const [selected, setSelected] = useState<ImageData | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    // biome-ignore lint/suspicious/noAlert: ignore
    const confirmUpload = window.confirm(
      "Please avoid uploading too many images unnecessarily to save storage space. Also, ensure your images comply with copyright rules. Do you wish to continue?"
    );

    if (confirmUpload) {
      fileInput.current?.click();
    }
  };

  const loadImage = (file: File): Promise<ImageData> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        resolve({
          url,
          width: image.width,
          height: image.height,
          format: file.type.split("/")[1] ?? "",
          // biome-ignore lint/performance/useTopLevelRegex: by author
          display_name: file.name.split(/\.\w+$/)[0] ?? "",
        });
      };
      image.src = url;
    });
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return null;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    const previewPromises = Array.from(files).map(loadImage);
    const loadedPreviews = await Promise.all(previewPromises);
    setPreviews(loadedPreviews);

    const uploadPromises = Array.from(files).map(uploadImage);
    const uploadResults = await Promise.all(uploadPromises);
    const uploadedImages = uploadResults.filter(
      (img): img is ImageData => img !== null
    );

    for (const preview of loadedPreviews) {
      URL.revokeObjectURL(preview.url);
    }
    setPreviews(defaultImages);
    setImages((prev) => [...uploadedImages, ...prev]);
    setUploading(false);
  };

  const handleFinish = () => selected !== null && onInsert?.(selected);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/images");
        const data = await response.json();

        // Ensure data is always an array
        if (Array.isArray(data)) {
          setImages(data);
        } else if (data?.images && Array.isArray(data.images)) {
          setImages(data.images);
        } else if (data?.data && Array.isArray(data.data)) {
          setImages(data.data);
        } else {
          console.error("Unexpected API response format:", data);
          setImages([]);
        }
      } catch (error) {
        console.error("Error fetching images:", error);
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  return (
    <div className="media-library">
      <header className="media-library__header">
        <h2>Assets</h2>
        <Button disabled={loading || uploading} onClick={handleUploadClick}>
          Upload
        </Button>
      </header>

      <div className="media-library__content">
        {loading ? (
          // biome-ignore lint/a11y/useAriaPropsSupportedByRole: by author
          <div aria-label="Loading images" className="media-library__spinner" />
        ) : (
          <MediaGallery
            data={[...previews, ...images]}
            onSelect={setSelected}
            selected={selected}
          />
        )}
      </div>

      <footer className="media-library__footer">
        <Button
          className="media-library__btn media-library__btn--cancel"
          onClick={onClose}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          className="media-library__btn media-library__btn--finish"
          disabled={!selected || loading || uploading}
          onClick={handleFinish}
        >
          Insert
        </Button>
      </footer>

      <input
        accept="image/*"
        multiple
        onChange={handleFileChange}
        ref={fileInput}
        style={{ display: "none" }}
        type="file"
      />
    </div>
  );
};

export default MediaLibrary;
