import React from "react";
import { PlusIcon, MinusIcon } from "lucide-react";

import { useMap } from "@/contexts/map-context";
import { Button } from "@kaa/ui/components/button";

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
			<Button variant="ghost" size="icon" onClick={zoomIn}>
				<PlusIcon className="h-5 w-5" />
				<span className="sr-only">Zoom in</span>
			</Button>
			<Button variant="ghost" size="icon" onClick={zoomOut}>
				<MinusIcon className="h-5 w-5" />
				<span className="sr-only">Zoom out</span>
			</Button>
		</aside>
	);
}
