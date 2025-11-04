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
  SheetTrigger,
} from "@kaa/ui/components/sheet";
import { Loader, Plus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateApplication } from "../application.mutations";
import {
  type CreateApplicationSchema,
  createApplicationSchema,
} from "../application.schema";
import { ApplicationForm } from "./application-form";

export function CreateApplicationSheet() {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const createApplicationMutation = useCreateApplication();

  const form = useForm<CreateApplicationSchema>({
    resolver: zodResolver(createApplicationSchema),
  });

  function onSubmit(input: CreateApplicationSchema) {
    startTransition(async () => {
      await createApplicationMutation.mutateAsync(input);

      if (createApplicationMutation.error) {
        toast.error(createApplicationMutation.error.message);
        return;
      }

      form.reset();
      setOpen(false);
      toast.success("Application created");
    });
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus />
          New application
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Create application</SheetTitle>
          <SheetDescription>
            Fill in the details below to create a new application
          </SheetDescription>
        </SheetHeader>
        <ApplicationForm form={form} onSubmit={onSubmit}>
          <SheetFooter className="gap-2 pt-2 sm:space-x-0">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>
            <Button disabled={isPending}>
              {isPending && <Loader className="animate-spin" />}
              Create
            </Button>
          </SheetFooter>
        </ApplicationForm>
      </SheetContent>
    </Sheet>
  );
}
