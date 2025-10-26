import { zodResolver } from "@hookform/resolvers/zod";
// import { useCreateRequestMutation } from '@/components/common/requests/query';
import { Button } from "@kaa/ui/components/button";
import { Form } from "@kaa/ui/components/form";
import { Mail, MessageSquare, Send, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { isValidElement, lazy, Suspense, useMemo } from "react";
import type { SubmitHandler, UseFormProps } from "react-hook-form";
import * as z from "zod";
import {
  isDialog as checkDialog,
  dialog,
} from "@/components/common/dialoger/state";
import InputFormField from "@/components/common/form-fields/input";
// import { toaster } from "@/components/common/toaster";
import UnsavedBadge from "@/components/common/unsaved-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { useBreakpoints } from "@/hooks/use-breakpoints";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import { useAuthStore } from "@/modules/auth";

// import { createRequestSchema } from '#/routes/requests/schema';

enum ContactFormType {
  CONTACT = "contact",
  SUPPORT = "support",
  OTHER = "other",
}

const createRequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Email is required"),
  message: z.string().min(2, "Message is required"),
  type: z.enum(ContactFormType),
});

const ContactFormMap = lazy(
  () => import("@/components/common/contact-form/contact-form-map")
);

// Main contact form map component
const ContactForm = ({ dialog: isDialog }: { dialog?: boolean }) => {
  const t = useTranslations();
  const { user } = useAuthStore();
  const isMediumScreen = useBreakpoints("min", "md");

  const formSchema = createRequestSchema.extend({
    name: z.string().min(2, t("errors:name_required")),
  });

  type FormValues = z.infer<typeof formSchema>;

  const name = `${user?.firstName} ${user?.lastName}`;

  const formOptions: UseFormProps<FormValues> = useMemo(
    () => ({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name,
        email: user?.email || "",
        message: "",
        type: ContactFormType.CONTACT,
      },
    }),
    [formSchema, name, user?.email]
  );

  const dialogTitleUpdate = () => {
    const targetDialog = dialog.get("contact-form");
    if (!(targetDialog && checkDialog(targetDialog))) return;

    // Check if the title's type is a function (React component) and not a string
    if (
      isValidElement(targetDialog.title) &&
      targetDialog.title.type === UnsavedBadge
    )
      return;

    dialog.update("contact-form", {
      title: <UnsavedBadge title={targetDialog?.title} />,
    });
  };

  const form = useFormWithDraft<FormValues>("contact-form", {
    formOptions,
    onUnsavedChanges: dialogTitleUpdate,
  });

  const cancel = () => {
    form.reset();
    // biome-ignore lint/nursery/noUnusedExpressions: we need to remove the dialog if it is open
    isDialog && dialog.remove();
  };

  // const { mutate: createRequest } = useCreateRequestMutation();

  const onSubmit: SubmitHandler<FormValues> = (body) => {
    console.log(body);
    // createRequest(body, {
    //   onSuccess: () => {
    //     toaster(t("common:message_sent.text"), "success");
    //     if (isDialog) dialog.remove();
    //     form.reset();
    //   },
    //   onError: () => {
    //     toaster(t("errors:reported_try_later"), "error");
    //   },
    // });
  };

  return (
    <div className="flex w-full flex-col gap-8 md:flex-row">
      <div className="w-full">
        <div className="w-full">
          <Form {...form}>
            <form
              className="space-y-4 md:space-y-6"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <InputFormField
                control={form.control}
                icon={<User size={16} />}
                label={t("common:name")}
                name="name"
              />
              <InputFormField
                control={form.control}
                icon={<Mail size={16} />}
                label={t("common:email")}
                name="email"
                required
                type="email"
              />
              <InputFormField
                control={form.control}
                icon={<MessageSquare size={16} />}
                label={t("common:message")}
                name="message"
                type="textarea"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <SubmitButton>
                  <Send className="mr-2" size={16} />
                  {t("common:send")}
                </SubmitButton>
                <Button
                  className={form.formState.isDirty ? "" : "invisible"}
                  onClick={cancel}
                  type="reset"
                  variant="secondary"
                >
                  {t("common:cancel")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      {isMediumScreen && (
        <Suspense>
          <div className="w-full">
            <ContactFormMap />
          </div>
        </Suspense>
      )}
    </div>
  );
};

export default ContactForm;
