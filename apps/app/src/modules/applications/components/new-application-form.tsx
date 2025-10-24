import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { useTranslations } from "next-intl";
import { type FC, useMemo } from "react";
import type { UseFormProps } from "react-hook-form";
import InputFormField from "@/components/common/form-fields/input";
import UnsavedBadge from "@/components/common/unsaved-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import { useCreateApplication } from "../application.mutations";
import {
  type ApplicationFormValues,
  applicationFormSchema,
} from "../application.schema";
import type { Application } from "../application.type";

type ApplicationFormProps = {
  application: Application;
  sheet?: boolean;
  callback?: (property: Application) => void;
  hiddenFields?: string[];
};

export const NewApplicationForm: FC<ApplicationFormProps> = ({
  hiddenFields,
}) => {
  const t = useTranslations();
  const createApplicationMutation = useCreateApplication();

  const initialFormValues = {
    property: "",
    moveInDate: "",
    offerAmount: 0,
    notes: "",
    documents: [],
  };
  const formOptions: UseFormProps<ApplicationFormValues> = useMemo(
    () => ({
      resolver: zodResolver(applicationFormSchema),
      defaultValues: initialFormValues,
    }),
    []
  );

  const form = useFormWithDraft<ApplicationFormValues>("application-form", {
    formOptions,
    onUnsavedChanges: () => console.info("Unsaved changes detected!"),
  });

  const onSubmit = (data: ApplicationFormValues) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {form.unsavedChanges && <UnsavedBadge />}

        <FormField
          control={form.control}
          name="property"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Type</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <InputFormField
          control={form.control}
          inputClassName="border"
          label={t("common.notes")}
          name="notes"
          required
        />

        <InputFormField
          control={form.control}
          inputClassName="border"
          label={t("common.notes")}
          name="offerAmount"
          required
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <SubmitButton
            disabled={
              !(hiddenFields?.length || form.formState.isDirty) ||
              Object.keys(form.formState.errors).length > 0
            }
            loading={createApplicationMutation.isPending}
          >
            {t(`common.${hiddenFields?.length ? "continue" : "save_changes"}`)}
          </SubmitButton>
          <Button
            className={form.formState.isDirty ? "" : "invisible"}
            onClick={() => form.reset()}
            type="reset"
            variant="secondary"
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
