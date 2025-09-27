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
import { Undo } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { type Control, useFormContext, useWatch } from "react-hook-form";
import slugify from "slugify";
import { useMeasure } from "@/hooks/use-measure";
import { useOnlineManager } from "@/hooks/use-online-manager";

type SlugFieldProps = {
  control: Control<any>;
  label: string;
  nameValue?: string;
  description?: string;
};

export const SlugFormField = ({
  control,
  label,
  description,
  nameValue,
}: SlugFieldProps) => {
  const t = useTranslations();
  const { isOnline } = useOnlineManager();

  const [isDeviating, setDeviating] = useState(false);
  const [isSlugAvailable, setSlugAvailable] = useState<
    "available" | "blank" | "notAvailable"
  >("blank");

  const inputClassName = `${isSlugAvailable !== "blank" && "ring-2 focus-visible:ring-2"}
                          ${isSlugAvailable === "available" && "ring-green-500 focus-visible:ring-green-500"}
                          ${isSlugAvailable === "notAvailable" && "ring-red-500 focus-visible:ring-red-500"}`;

  const form = useFormContext<{ slug: string }>();

  const prefixMeasure = useMeasure<HTMLButtonElement>();
  const revertMeasure = useMeasure<HTMLDivElement>();

  // Watch to check if slug availability
  const slug = useWatch({ control: form.control, name: "slug" });

  // Only show green ring if slug is valid
  const isValidSlug = (value: string) => {
    if (!value || value.trim().length < 2) return false;
    // biome-ignore lint/performance/useTopLevelRegex: regex is defined in the top level scope
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
  };

  // Check on change
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies are checked
  useEffect(() => {
    if (!slug) return;
    if (slug.length < 2 || isValidSlug(slug)) return setSlugAvailable("blank");
    if (isValidSlug(slug)) {
      if (slug.length < 2) return setSlugAvailable("notAvailable");
      if (!isOnline) return;

      const params: { slug: string } = { slug };
      return isValidSlug(params.slug)
        ? setSlugAvailable("available")
        : setSlugAvailable("notAvailable");
    }
    if (!isValidSlug(slug)) return setSlugAvailable("notAvailable");
  }, [slug]);

  // In create forms, auto-generate slug from name
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies are checked
  useEffect(() => {
    if (isDeviating) return;
    form.setValue(
      "slug",
      slugify(nameValue || "", { lower: true, strict: true })
    );
  }, [nameValue]);

  // Revert to previous slug
  const revertSlug = () => {
    form.resetField("slug");
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
              <Input
                className={inputClassName}
                onFocus={() => setDeviating(true)}
                style={getStyle()}
                value={formFieldValue || ""}
                {...rest}
              />
              {slug && (
                <div
                  className="absolute inset-y-1 right-1 flex justify-end"
                  id="slug-revert"
                  ref={revertMeasure.ref}
                >
                  <Button
                    aria-label={t("common.revert_handle")}
                    className="h-full"
                    onClick={revertSlug}
                    size="sm"
                    variant="ghost"
                  >
                    <Undo size={16} />{" "}
                    <span className="ml-1 max-sm:hidden">
                      {t("common.revert")}
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
