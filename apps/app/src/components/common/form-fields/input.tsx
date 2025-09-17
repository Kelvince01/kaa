"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Textarea } from "@kaa/ui/components/textarea";
import type { ReactNode } from "react";
import {
  type Control,
  type FieldValues,
  type Path,
  useFormContext,
} from "react-hook-form";

type Props<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  value?: string;
  defaultValue?: string;
  type?: Parameters<typeof Input>[0]["type"] | "textarea";
  description?: string;
  placeholder?: string;
  onFocus?: () => void;
  minimal?: boolean;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  autoFocus?: boolean;
  inputClassName?: string;
};

const InputFormField = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  value,
  defaultValue,
  description,
  onFocus,
  type = "text",
  placeholder,
  required,
  readOnly,
  disabled,
  icon,
  autoFocus,
  inputClassName,
}: Props<TFieldValues>) => {
  const { setFocus } = useFormContext();

  const InputComponent = type === "textarea" ? Textarea : Input;

  const iconClick = () => {
    setFocus(name.toString());
  };

  return (
    <FormField
      control={disabled ? undefined : control}
      name={name}
      render={({ field: { value: formFieldValue, ...rest } }) => (
        <FormItem name={name.toString()}>
          <FormLabel>
            {label}
            {required && <span className="ml-1 opacity-50">*</span>}
          </FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <div className="relative flex w-full items-center">
              {icon && (
                <button
                  className="absolute left-3 font-light text-xs"
                  onClick={iconClick}
                  style={{ opacity: value || formFieldValue ? 1 : 0.5 }}
                  tabIndex={-1}
                  type="button"
                >
                  {icon}
                </button>
              )}
              <InputComponent
                autoFocus={autoFocus}
                className={inputClassName}
                defaultValue={defaultValue}
                disabled={disabled}
                onFocus={onFocus}
                placeholder={placeholder}
                readOnly={readOnly}
                style={{ paddingLeft: icon ? "2rem" : "" }}
                value={value || formFieldValue || ""}
                {...(type === "textarea" ? { autoResize: true } : {})}
                {...rest}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default InputFormField;
