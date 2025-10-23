import { config } from "@kaa/config";
import { Undo } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/common/confetti";
import { MenuSheet } from "@/components/common/navigation/menu-sheet";
import { sheet } from "@/components/common/sheeter/state";
import { useNewPropertyStore } from "@/modules/properties/property.store";

export const NewPropertyCompleted = () => {
  const t = useTranslations();
  const { isNewPropertyOpen, finishedCreating } = useNewPropertyStore();

  const [isExploding, _] = useState(true);
  const effectRan = useRef(false);

  useEffect(() => {
    // If already run, exit
    if (effectRan.current) return;
    effectRan.current = true;

    // onPropertyFinishCallback();

    setTimeout(
      () => {
        sheet.create(<MenuSheet />, {
          id: "menu-nav",
          side: "left",
          modal: false,
          className:
            "fixed sm:z-80 inset-0 left-16 p-0 backdrop-blur-xs max-w-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        });
      },
      isNewPropertyOpen ? 500 : 4000
    );
  }, [isNewPropertyOpen]);

  return (
    <div className="relative z-1 mx-auto flex h-screen min-w-full max-w-3xl flex-col items-center justify-center space-y-6 p-4 text-center">
      {isExploding && <Confetti fire />}

      {finishedCreating && (
        <Undo
          className="xl:-translate-x-24 -mt-40 -mb-12 rotate-30 scale-y-75 text-primary max-lg:hidden"
          size={400}
          strokeWidth={0.1}
        />
      )}
      <h1 className="font-bold text-3xl">
        {t("properties.new.completed.title")}
      </h1>
      <p className="pb-8 font-light text-foreground/90 text-xl leading-7 md:text-2xl">
        {t("properties.new.completed.description", { appName: config.name })}
      </p>
    </div>
  );
};
