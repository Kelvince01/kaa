"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import { Loader } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUpdateApplication } from "../application.mutations";
import {
  type UpdateApplicationSchema,
  updateApplicationSchema,
} from "../application.schema";
import type { Application, ApplicationStatus } from "../application.type";
import { ApplicationForm } from "../components/application-form";

interface UpdateApplicationSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  application: Application | null;
}

export function UpdateApplicationSheet({
  application,
  ...props
}: UpdateApplicationSheetProps) {
  const [isPending, startTransition] = React.useTransition();
  const updateApplicationMutation = useUpdateApplication();

  const form = useForm<UpdateApplicationSchema>({
    resolver: zodResolver(updateApplicationSchema),
    defaultValues: {
      //   title: application?.title ?? "",
      //   label: application?.label,
      status: application?.status,
      //   priority: application?.priority,
    },
  });

  function onSubmit(input: UpdateApplicationSchema) {
    startTransition(async () => {
      if (!application) return;

      await updateApplicationMutation.mutateAsync({
        id: application._id,
        data: { status: input.status as ApplicationStatus },
      });

      form.reset(input);
      props.onOpenChange?.(false);
      toast.success("Application updated");
    });
  }

  return (
    <Sheet {...props}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Update application</SheetTitle>
          <SheetDescription>
            Update the application details and save the changes
          </SheetDescription>
        </SheetHeader>
        <ApplicationForm<UpdateApplicationSchema>
          form={form}
          onSubmit={onSubmit}
        >
          <SheetFooter className="gap-2 pt-2 sm:space-x-0">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>
            <Button disabled={isPending}>
              {isPending && (
                <Loader
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              Save
            </Button>
          </SheetFooter>
        </ApplicationForm>
      </SheetContent>
    </Sheet>
  );
}
