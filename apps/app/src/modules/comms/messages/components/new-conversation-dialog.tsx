/**
 * New Conversation Dialog
 *
 * Dialog for creating new conversations with user selection
 */

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import { Search, UserPlus, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useUsers } from "@/modules/users/user.queries";
import { useCreateConversation } from "../message.queries";
import { ConversationType } from "../message.type";

type NewConversationDialogProps = {
  children?: React.ReactNode;
  onConversationCreated?: (conversationId: string) => void;
};

export function NewConversationDialog({
  children,
  onConversationCreated,
}: NewConversationDialogProps) {
  const [open, setOpen] = useState(false);
  const [conversationType, setConversationType] = useState<ConversationType>(
    ConversationType.DIRECT
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const createConversationMutation = useCreateConversation();
  const { data: usersData } = useUsers({
    search: searchQuery,
    limit: 10,
    isActive: true,
  });
  const users = usersData?.users || [];

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    return (
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handle user selection
  const handleUserToggle = useMemo(
    () => (userId: string) => {
      setSelectedUsers((prev) => {
        if (prev.includes(userId)) {
          return prev.filter((id) => id !== userId);
        }
        return [...prev, userId];
      });
    },
    []
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) return;

    try {
      const result = await createConversationMutation.mutateAsync({
        type: conversationType,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        participantIds: selectedUsers,
      });

      onConversationCreated?.(result.conversation._id || "");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setConversationType(ConversationType.DIRECT);
    setTitle("");
    setDescription("");
    setSelectedUsers([]);
    setSearchQuery("");
  };

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const canSubmit =
    selectedUsers.length > 0 && !createConversationMutation.isPending;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button onClick={() => setOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            New Conversation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogDescription>
            Create a new conversation and invite participants
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            {/* Conversation Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Conversation Type</Label>
              <Select
                onValueChange={(value: ConversationType) =>
                  setConversationType(value)
                }
                value={conversationType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Message</SelectItem>
                  <SelectItem value="group">Group Chat</SelectItem>
                  <SelectItem value="support">Support Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title {conversationType === "direct" && "(Optional)"}
              </Label>
              <Input
                id="title"
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  conversationType === "direct"
                    ? "Auto-generated from participants"
                    : "Enter conversation title"
                }
                value={title}
              />
            </div>
          </div>

          {/* Description */}
          {conversationType !== "direct" && (
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this conversation"
                rows={2}
                value={description}
              />
            </div>
          )}

          {/* User Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Participants</Label>
              <Badge variant="secondary">{selectedUsers.length} selected</Badge>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                value={searchQuery}
              />
            </div>

            {/* User List */}
            <ScrollArea className="h-48 rounded-md border p-2">
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user.id);

                  return (
                    <div
                      className={cn(
                        "flex cursor-pointer items-center space-x-3 rounded-lg p-2 transition-colors",
                        isSelected ? "bg-muted" : "hover:bg-muted/50"
                      )}
                      key={user.id}
                      onClick={() => handleUserToggle(user.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                        onChange={() => handleUserToggle(user.id)}
                      />

                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {user.email}
                        </p>
                      </div>

                      {/* <Badge className="text-xs" variant="outline">
                        {user.role}
                      </Badge> */}
                    </div>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 h-8 w-8" />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Selected Users Preview */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Participants</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((userId) => {
                  const user = users.find((u) => u.id === userId);
                  if (!user) return null;

                  return (
                    <Badge
                      className="flex items-center space-x-1"
                      key={userId}
                      variant="secondary"
                    >
                      <span>
                        {user.firstName} {user.lastName}
                      </span>
                      <Button
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleUserToggle(userId)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={!canSubmit} type="submit">
              {createConversationMutation.isPending
                ? "Creating..."
                : "Create Conversation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
