import { Button } from "@kaa/ui/components/button";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useMap } from "@/contexts/map-context";

export default function MapControls() {
  const { map } = useMap();

  const zoomIn = () => {
    map?.zoomIn();
  };

  const zoomOut = () => {
    map?.zoomOut();
  };

  return (
    <aside className="absolute right-4 bottom-8 z-10 flex flex-col gap-2 rounded-lg bg-background p-2 shadow-lg">
      <Button onClick={zoomIn} size="icon" variant="ghost">
        <PlusIcon className="h-5 w-5" />
        <span className="sr-only">Zoom in</span>
      </Button>
      <Button onClick={zoomOut} size="icon" variant="ghost">
        <MinusIcon className="h-5 w-5" />
        <span className="sr-only">Zoom out</span>
      </Button>
    </aside>
  );
}
