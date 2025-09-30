"use client";

import { Button } from "@kaa/ui/components/button";
import { Label } from "@kaa/ui/components/label";
import { cn } from "@kaa/ui/lib/utils";
import { ChevronUp, HelpCircle } from "lucide-react";
import { type Label as LabelPrimitive, Slot as SlotPrimitive } from "radix-ui";

import * as React from "react";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  type FormProviderProps,
  useFormContext,
  useFormState,
} from "react-hook-form";

export type LabelDirectionType = "top" | "left";
const LabelDirectionContext = React.createContext<LabelDirectionType | string>(
  "top"
);

type FormProps<
  TFieldValues extends FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues = TFieldValues,
> = FormProviderProps<TFieldValues, TContext, TTransformedValues> & {
  unsavedChanges?: boolean;
  labelDirection?: string;
};

const Form = <
  TFieldValues extends FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues = TFieldValues,
>({
  children,
  unsavedChanges,
  labelDirection = "top",
  ...props
}: FormProps<TFieldValues, TContext, TTransformedValues> & {
  unsavedChanges?: boolean;
}) => (
  <FormProvider {...props}>
    <LabelDirectionContext.Provider value={labelDirection}>
      {children}
    </LabelDirectionContext.Provider>
  </FormProvider>
);

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

// INFO: added to support targeting the entire form item (for example to hide)
type FormItemProps = React.HTMLAttributes<HTMLDivElement> & {
  name?: string;
};

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, name, ...props }, ref) => {
    const id = React.useId();
    const labelDirection = React.useContext(LabelDirectionContext);

    return (
      <FormItemContext.Provider value={{ id }}>
        <div
          className={cn(
            `${labelDirection === "top" ? "flex-col" : "flex-row items-center"} flex gap-2`,
            className
          )}
          data-slot="form-item"
          id={`${(name || id).toLowerCase()}-form-item-container`}
          ref={ref}
          {...props}
        />
      </FormItemContext.Provider>
    );
  }
);
FormItem.displayName = "FormItem";

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      className={cn("data-[error=true]:text-destructive", className)}
      data-error={!!error}
      data-slot="form-label"
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({
  ...props
}: React.ComponentProps<typeof SlotPrimitive.Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <SlotPrimitive.Slot
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`
      }
      aria-invalid={!!error}
      data-slot="form-control"
      id={formItemId}
      {...props}
    />
  );
}

// EDIT: This is customized to allow for collapsible descriptions
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ children, className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  const [collapsed, setCollapsed] = React.useState(true);

  const toggleCollapsed = (e: { preventDefault: () => void }) => {
    setCollapsed(!collapsed);
    e.preventDefault();
  };

  return (
    <div
      className={cn(
        "-mt-2! relative font-light text-muted-foreground text-sm",
        className
      )}
      id={formDescriptionId}
      ref={ref}
      {...props}
    >
      <div className="flex justify-between">
        <Button
          className="-top-6 absolute right-1 h-auto p-2 text-regular opacity-50 ring-inset hover:opacity-100"
          onClick={toggleCollapsed}
          size="sm"
          type="button"
          variant="link"
        >
          {collapsed && <HelpCircle size={16} />}
          {!collapsed && <ChevronUp size={16} />}
        </Button>
        {!collapsed && <span className="py-1">{children}</span>}
      </div>
    </div>
  );
});
FormDescription.displayName = "FormDescription";

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      className={cn("text-destructive text-sm", className)}
      data-slot="form-message"
      id={formMessageId}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
