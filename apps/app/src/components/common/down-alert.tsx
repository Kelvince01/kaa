"use client";

import { config } from "@kaa/config";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import { AlertTriangle, CloudOff, Construction, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useOnlineManager } from "@/hooks/use-online-manager";
import { healthCheck } from "@/lib/health-check";
import { useAlertStore } from "@/shared/stores/alert.store";
import { useUIStore } from "@/shared/stores/ui.store";

const downAlertConfig = {
  offline: {
    icon: CloudOff,
    titleKey: "common.offline.title",
    textKey: "common.offline.text",
  },
  maintenance: {
    icon: Construction,
    titleKey: "common.maintenance_mode.title",
    textKey: "common.maintenance_mode.text",
  },
  auth_unavailable: {
    icon: AlertTriangle,
    titleKey: "common.auth_unavailable.title",
    textKey: "common.auth_unavailable.text",
  },
} as const;

export const DownAlert = () => {
  const t = useTranslations();
  const { downAlert, setDownAlert } = useAlertStore();
  const { offlineAccess } = useUIStore();
  const { isOnline } = useOnlineManager();
  const [isNetworkAlertClosed, setIsNetworkAlertClosed] = useState(false);

  useEffect(() => {
    (async () => {
      if (isOnline && downAlert === "offline") {
        setDownAlert(null);
      }
      if (!(isOnline || downAlert || isNetworkAlertClosed)) {
        setDownAlert("offline");
        if (!offlineAccess) {
          const isBackendOnline = await healthCheck(
            `${config.backendUrl}/health`
          );
          if (isBackendOnline) {
            setDownAlert(null);
          }
        }
      }
    })();
  }, [downAlert, isOnline, offlineAccess, isNetworkAlertClosed, setDownAlert]);

  const cancelAlert = () => {
    setDownAlert(null);
    setIsNetworkAlertClosed(true);
  };

  if (!downAlert) return null;

  const alertConfig = downAlertConfig[downAlert] || downAlertConfig.offline;
  const Icon = alertConfig.icon;

  const alertText =
    downAlert === "offline" && offlineAccess
      ? t.rich("common.offline_access.offline", {
          site_anchor: (chunks: any) => (
            <button className="underline" onClick={cancelAlert} type="button">
              {chunks}
            </button>
          ),
        })
      : t(alertConfig.textKey);

  return (
    <div className="pointer-events-auto fixed right-4 bottom-4 left-4 z-2000 justify-center border-0 max-sm:bottom-20">
      <Alert className="w-auto border-0" variant="destructive">
        <Button
          className="absolute top-2 right-2"
          onClick={cancelAlert}
          size="sm"
          variant="ghost"
        >
          <X size={16} />
        </Button>
        <Icon size={16} />

        <AlertDescription className="pr-8 font-light">
          <strong>{t(alertConfig.titleKey)}</strong>
          <span className="mx-2">&#183;</span>
          <span className="max-sm:hidden">{alertText}</span>
          <button
            className="inline-block font-semibold sm:hidden"
            onClick={cancelAlert}
            type="button"
          >
            {t("common.continue")}
          </button>
          {config.statusUrl && (
            <>
              <span className="mx-2 sm:hidden">&#183;</span>
              <a
                className="ml-1 font-semibold hover:underline hover:underline-offset-2 max-sm:capitalize"
                href={config.statusUrl}
                rel="noreferrer"
                target="_blank"
              >
                {t("common.status_page")}
              </a>
              <span className="max-sm:hidden">.</span>
            </>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};
