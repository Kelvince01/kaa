"use client";

import { Tabs, TabsList, TabsTrigger } from "@kaa/ui/components/tabs";
import {
  MapIcon,
  MoonIcon,
  SatelliteIcon,
  SunIcon,
  TreesIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type React from "react";
import { useEffect, useState } from "react";
import { useMap } from "@/contexts/map-context";

type StyleOption = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "streets-v12",
    label: "Map",
    icon: <MapIcon className="h-5 w-5" />,
  },
  {
    id: "satellite-streets-v12",
    label: "Satellite",
    icon: <SatelliteIcon className="h-5 w-5" />,
  },
  {
    id: "outdoors-v12",
    label: "Terrain",
    icon: <TreesIcon className="h-5 w-5" />,
  },

  {
    id: "light-v11",
    label: "Light",
    icon: <SunIcon className="h-5 w-5" />,
  },
  {
    id: "dark-v11",
    label: "Dark",
    icon: <MoonIcon className="h-5 w-5" />,
  },
];

export default function MapStyles() {
  const { map } = useMap();
  const { setTheme } = useTheme();
  const [activeStyle, setActiveStyle] = useState("streets-v12");

  const handleChange = (value: string) => {
    if (!map) return;
    map.setStyle(`mapbox://styles/mapbox/${value}`);
    setActiveStyle(value);
  };

  useEffect(() => {
    if (activeStyle === "dark-v11") {
      setTheme("dark");
    } else setTheme("light");
  }, [activeStyle, setTheme]);

  return (
    <aside className="absolute bottom-4 left-4 z-10">
      <Tabs onValueChange={handleChange} value={activeStyle}>
        <TabsList className="bg-background shadow-lg">
          {STYLE_OPTIONS.map((style) => (
            <TabsTrigger
              className="flex items-center text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-3 sm:py-1.5"
              key={style.id}
              value={style.id}
            >
              {style.icon}
              <span className="hidden sm:inline">{style.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </aside>
  );
}
