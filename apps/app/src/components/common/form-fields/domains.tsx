"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { type Control, useFormContext } from "react-hook-form";
import { TagInput } from "@/components/ui/tag-input";

const domainRegex =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/i;

type Props = {
  control: Control;
  label: string;
  description?: string;
  required?: boolean;
};

const DomainsFormField = ({ control, label, description, required }: Props) => {
  const t = useTranslations();

  const { getValues } = useFormContext();
  const formValue = getValues("emailDomains");

  const [fieldActive, setFieldActive] = useState(false);
  const [domains, setDomains] = useState<string[]>(
    formValue.map((dom: string) => dom)
  );
  const [currentValue, setCurrentValue] = useState("");

  const checkValidInput = (value: string) => {
    if (!value || value.trim().length < 2) return true;
    return checkValidDomain(value);
  };

  const checkValidDomain = (domain: string) => domainRegex.test(domain.trim());

  useEffect(() => setDomains(formValue.map((dom: string) => dom)), [formValue]);

  return (
    <FormField
      control={control}
      name="emailDomains"
      render={({ field: { onChange } }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="ml-1 opacity-50">*</span>}
          </FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <TagInput
              inputProps={{ value: currentValue }}
              maxLength={100}
              minLength={4}
              onBlur={() => {
                if (checkValidDomain(currentValue))
                  setDomains((prev) => [...prev, currentValue]);
                setCurrentValue("");
                setFieldActive(false);
              }}
              onFocus={() => setFieldActive(true)}
              onInputChange={(newValue) => setCurrentValue(newValue)}
              placeholder={t("common.placeholder.email_domains")}
              setTags={(newTags) => {
                setDomains(newTags);
                if (Array.isArray(newTags)) onChange(newTags.map((tag) => tag));
                setCurrentValue("");
              }}
              styleClasses={{
                tag: {
                  body: "pr-0 gap-0.5",
                  closeButton:
                    "h-6 w-6 ring-inset focus-visible:ring-2 p-0 rounded-full hover:bg-transparent cursor-pointer",
                },
                input: `${
                  fieldActive
                    ? checkValidInput(currentValue)
                      ? "ring-2 focus-visible:ring-2 ring-red-500 focus-visible:ring-red-500"
                      : "max-sm:ring-offset-0  max-sm:ring-transparent ring-2 ring-offset-2 ring-white"
                    : ""
                }`,
              }}
              tagListPlacement="inside"
              tags={domains}
              validateTag={checkValidDomain}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DomainsFormField;
