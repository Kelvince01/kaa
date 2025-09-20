import MediaThemeSutro from "player.style/sutro/react";

const RenderVideo = ({
  src,
  className,
}: {
  src: string;
  className?: string;
}) => (
  <MediaThemeSutro className={className}>
    {/* biome-ignore lint/a11y/useMediaCaption: by author */}
    <video crossOrigin="anonymous" playsInline slot="media" src={src} />
  </MediaThemeSutro>
);

export default RenderVideo;
