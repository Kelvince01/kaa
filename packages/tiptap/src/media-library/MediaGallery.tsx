import clsx from "clsx";
import { LuCheck } from "react-icons/lu";

export type ImageData = {
  id?: string;
  url: string;
  created_at?: string;
  bytes?: number;
  format: string;
  display_name: string;
  width: number;
  height: number;
};

type MediaGalleryProps = {
  data: ImageData[];
  selected: any | null;
  onSelect: (image: any) => void;
};

const MediaGallery: React.FC<MediaGalleryProps> = ({
  data,
  selected,
  onSelect,
}) => {
  return (
    <div className="media-gallery">
      {data?.map((image, index) => (
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: by author
        // biome-ignore lint/a11y/noStaticElementInteractions: by author
        // biome-ignore lint/a11y/useKeyWithClickEvents: by author
        <div
          className={clsx("media-item", {
            "media-item--selected": selected?.id === image?.id,
            "media-item--uploading": !image?.id,
          })}
          key={image.id || index}
          onClick={() => onSelect(image)}
        >
          {image?.id && (
            <div className="media-item__checkbox">
              {selected?.id === image.id && <LuCheck aria-hidden="true" />}
            </div>
          )}

          <div className="media-item__image-wrapper">
            {/** biome-ignore lint/nursery/useImageSize: by author */}
            {/** biome-ignore lint/performance/noImgElement: by author */}
            <img alt={image.display_name} src={image.url} />
          </div>

          <div className="media-item__info">
            <div className="media-item__name">{image.display_name}</div>
            <div className="media-item__details">
              <span>{image.format.toUpperCase()}</span>
              <span> • </span>
              <span>
                {image?.width} x {image?.height}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaGallery;
