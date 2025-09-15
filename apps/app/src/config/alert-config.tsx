import { config } from "@kaa/config";
import { Info } from "lucide-react";
import type { AlertWrap } from "@/components/common/alert-wrap";

// import { useTranslations } from "next-intl";

const alerts: AlertWrap[] = [];

// Explain how to sign in using test account
if (config.mode === "development") {
  alerts.push({
    id: "test-credentials",
    modes: ["public"],
    Icon: Info,
    className:
      "rounded-none border-0 border-t z-60 fixed bottom-0 left-0 right-0",
    children: (
      <>
        <strong className="mr-2">Testing credentials</strong>
        <p>
          Hi there! New developer? Welcome to Kaa! Sign in using{" "}
          <strong>admin-test@kaapro.dev</strong> and password{" "}
          <strong>12345678</strong>.
        </p>
      </>
    ),
  });
}

// In production mode, show a notice that the app is a pre-release version
if (config.mode === "production") {
  // const t = useTranslations();

  alerts.push({
    id: "prerelease",
    modes: ["app"],
    Icon: Info,
    className: "rounded-none border-0 border-b",
    children: (
      <>
        <strong className="mr-2">
          {/* {t("about.prerelease")} */}
          Pre-release
        </strong>
        {/* {t("common.experiment_notice.text")} */}
        Kaa is a pre-release version. Please use with caution.
      </>
    ),
  });
}

// Here you can set app-specific global alerts
export const alertsConfig = alerts;
