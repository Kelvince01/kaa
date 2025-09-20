import { config, type Entity } from "@kaa/config";
import { Button } from "@kaa/ui/components/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { useMutation } from "@tanstack/react-query";
import { Undo } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { type Control, useFormContext, useWatch } from "react-hook-form";
import slugify from "slugify";
import { useMeasure } from "@/hooks/use-measure";
import { useOnlineManager } from "@/hooks/use-online-manager";
import { checkSlugAvailable } from "@/modules/entities/entity.service";

type SlugFieldProps = {
  control: Control<any>;
  label: string;
  nameValue?: string;
  description?: string;
  previousSlug?: string;
  type: Entity;
};

export const SlugFormField = ({
  control,
  label,
  previousSlug,
  description,
  nameValue,
  type,
}: SlugFieldProps) => {
  const t = useTranslations();
  const { isOnline } = useOnlineManager();

  const [isDeviating, setDeviating] = useState(false);
  const [isSlugAvailable, setSlugAvailable] = useState<
    "available" | "blank" | "notAvailable"
  >("blank");

  const prefix = `${
    // biome-ignore lint/performance/useTopLevelRegex: regex is defined in the top level scope
    config.frontendUrl.replace(/^https?:\/\//, "")
  }/${type === "organization" ? "" : `${type}s/`}`;

  const inputClassName = `${isSlugAvailable !== "blank" && "ring-2 focus-visible:ring-2"}
                          ${isSlugAvailable === "available" && "ring-green-500 focus-visible:ring-green-500"}
                          ${isSlugAvailable === "notAvailable" && "ring-red-500 focus-visible:ring-red-500"}`;

  const form = useFormContext<{ slug: string }>();
  const { setFocus } = useFormContext();

  const prefixMeasure = useMeasure<HTMLButtonElement>();
  const revertMeasure = useMeasure<HTMLDivElement>();

  // Watch to check if slug availability
  const slug = useWatch({ control: form.control, name: "slug" });

  // Check if slug is available
  const { mutate: checkAvailability } = useMutation({
    mutationKey: ["slug"],
    mutationFn: checkSlugAvailable,
    onSuccess: (isAvailable) => {
      if (isValidSlug(slug)) form.clearErrors("slug");
      if (isAvailable && isValidSlug(slug))
        return setSlugAvailable("available");
      // Slug is not available
      form.setError("slug", {
        type: "manual",
        message: t("errors:slug_exists"),
      });
      setSlugAvailable("notAvailable");
    },
  });

  // Only show green ring if slug is valid
  const isValidSlug = (value: string) => {
    if (!value || value.trim().length < 2) return false;
    // biome-ignore lint/performance/useTopLevelRegex: regex is defined in the top level scope
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
  };

  // Check on change
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies are checked
  useEffect(() => {
    if (
      slug.length < 2 ||
      (isValidSlug(slug) && previousSlug && previousSlug === slug)
    )
      return setSlugAvailable("blank");
    if (isValidSlug(slug)) {
      if (!isOnline) return;

      const params: { slug: string; type: Entity } = { slug, type };
      return checkAvailability(params);
    }
    if (!isValidSlug(slug)) return setSlugAvailable("notAvailable");
  }, [slug]);

  // In create forms, auto-generate slug from name
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies are checked
  useEffect(() => {
    if (previousSlug || isDeviating) return;
    form.setValue(
      "slug",
      slugify(nameValue || "", { lower: true, strict: true })
    );
  }, [nameValue]);

  // Revert to previous slug
  const revertSlug = () => {
    form.resetField("slug");
  };

  const prefixClick = () => {
    setFocus("slug");
  };

  const getStyle = () => ({
    paddingLeft: `${prefixMeasure.bounds.width + 14}px`,
    paddingRight: `${revertMeasure.bounds.width + 14}px`,
  });

  return (
    <FormField
      control={control}
      name="slug"
      render={({ field: { value: formFieldValue, ...rest } }) => (
        <FormItem name="slug">
          <FormLabel>
            {label}
            <span className="ml-1 opacity-50">*</span>
          </FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <div className="relative flex w-full items-center">
              <button
                className="absolute left-3 font-light text-xs"
                id="slug-prefix"
                onClick={prefixClick}
                ref={prefixMeasure.ref}
                style={{ opacity: formFieldValue ? 1 : 0.5 }}
                tabIndex={-1}
                type="button"
              >
                {prefix}
              </button>

              <Input
                className={inputClassName}
                onFocus={() => setDeviating(true)}
                style={getStyle()}
                type={type}
                value={formFieldValue || ""}
                {...rest}
              />
              {previousSlug && previousSlug !== slug && (
                <div
                  className="absolute inset-y-1 right-1 flex justify-end"
                  id="slug-revert"
                  ref={revertMeasure.ref}
                >
                  <Button
                    aria-label={t("common:revert_handle")}
                    className="h-full"
                    onClick={revertSlug}
                    size="sm"
                    variant="ghost"
                  >
                    <Undo size={16} />{" "}
                    <span className="ml-1 max-sm:hidden">
                      {t("common:revert")}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
