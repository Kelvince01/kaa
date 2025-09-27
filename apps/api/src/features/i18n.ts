import { resolve } from "node:path";
import type { Logger } from "@bogeychan/elysia-logger/types";
import type { Context, RouteSchema } from "elysia";
import { Elysia, t } from "elysia";
import type { i18n as I18NextInstance, TFunction } from "i18next";

export type AppContext<T extends Partial<RouteSchema> = Partial<RouteSchema>> =
  Context<T> & {
    log: Logger;
    t: TFunction;
    i18n: I18NextInstance;
  };

export const i18nRoutes = new Elysia({
  prefix: "/api/i18n",
  tags: ["i18n"],
}).get(
  "/",
  // @ts-expect-error
  async ({
    i18n,
    log,
    query,
  }: AppContext<{
    query: { locale?: string; namespace?: string };
  }>) => {
    const locale =
      query.locale ??
      i18n.language ??
      i18n.options.fallbackLng?.toString() ??
      "en";
    const namespace =
      query.namespace ??
      (Array.isArray(i18n.options.ns)
        ? i18n.options.ns[0]
        : (i18n.options.ns ?? "translation"));

    const supportedLngsRaw = i18n.options.supportedLngs;
    const supportedLngs = Array.isArray(supportedLngsRaw)
      ? supportedLngsRaw.filter((lng) => lng !== "cimode")
      : [];

    const namespacesRaw = i18n.options.ns;
    const namespaces = Array.isArray(namespacesRaw)
      ? namespacesRaw
      : [namespacesRaw ?? "translation"];

    if (!supportedLngs.includes(locale)) {
      return new Response("Locale not supported", { status: 404 });
    }

    if (!namespaces.includes(namespace)) {
      return new Response("Namespace not supported", { status: 404 });
    }

    const backend = i18n.options.backend as
      | { [key: string]: unknown }
      | undefined;
    const loadPath = backend?.loadPath;

    let filePath: string | null = null;

    if (typeof loadPath === "string") {
      filePath = resolve(
        loadPath.replace("{{lng}}", locale).replace("{{ns}}", namespace)
      );
    } else if (typeof loadPath === "function") {
      const resolved = loadPath([locale], [namespace]);
      const path = Array.isArray(resolved) ? resolved[0] : resolved;
      filePath = resolve(path);
    } else {
      log.warn("Invalid i18n backend loadPath");
      return new Response("Translation backend misconfigured", { status: 500 });
    }

    // biome-ignore lint/correctness/noUndeclaredVariables: false positive
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return new Response("Translation file not found", { status: 404 });
    }

    let translations: any = {};
    try {
      translations = await file.json();
    } catch (e) {
      log.warn({ locale, namespace, error: e }, "Translation file load error");
      return new Response("Failed to parse translation file", { status: 500 });
    }

    return {
      locale,
      namespace,
      translations,
      availableLocales: supportedLngs,
      availableNamespaces: namespaces,
    };
  },
  {
    query: t.Object({
      locale: t.Optional(t.String()),
      namespace: t.Optional(t.String()),
    }),
  }
);
