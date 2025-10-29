"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
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
import { Loader2, UserPlus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useMembers } from "@/modules/members";
import { useAddMemberToOrganization } from "../organization.mutations";
import type { Organization } from "../organization.type";

type AddMemberDialogProps = {
  organization: Organization;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

const addMemberSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

export function AddMemberDialog({
  organization,
  open,
  onOpenChange,
  showTrigger = true,
}: AddMemberDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Fetch all members
  const { data: membersData, isLoading: isLoadingMembers } = useMembers({
    limit: 100, // Fetch more members for selection
  });

  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      memberId: "",
    },
  });

  const addMember = useAddMemberToOrganization();

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  const onSubmit = async (data: AddMemberFormValues) => {
    try {
      await addMember.mutateAsync({
        orgId: organization._id,
        data,
      });
      toast.success("Member added to organization successfully");
      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member to organization. Please try again.");
    }
  };

  // Filter out members that are already in this organization
  const existingMemberIds = organization.members || [];
  const availableMembers =
    membersData?.members?.filter(
      (member) => !existingMemberIds.includes(member._id)
    ) || [];

  return (
    <Dialog onOpenChange={handleOpenChange} open={open ?? isOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member to {organization.name}</DialogTitle>
          <DialogDescription>
            Select an existing member to add to this organization.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member</FormLabel>
                  <Select
                    disabled={isLoadingMembers}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingMembers
                              ? "Loading members..."
                              : "Select a member"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableMembers.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground text-sm">
                          {isLoadingMembers
                            ? "Loading..."
                            : "No available members"}
                        </div>
                      ) : (
                        availableMembers.map((member) => (
                          <SelectItem key={member._id} value={member._id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{member.name}</span>
                              <span className="text-muted-foreground text-xs">
                                {typeof member.user === "string"
                                  ? member.user
                                  : member.user?.email || "No email"}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                disabled={addMember.isPending}
                onClick={() => handleOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={addMember.isPending} type="submit">
                {addMember.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
