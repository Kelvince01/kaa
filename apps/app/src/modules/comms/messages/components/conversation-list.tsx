/**
 * Conversation List
 *
 * Displays list of user conversations with search and filtering
 */

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Input } from "@kaa/ui/components/input";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { cn } from "@kaa/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/modules/auth/use-auth";
import type { ConversationResponse } from "../message.type";
import { NewConversationDialog } from "./new-conversation-dialog";

type ConversationListProps = {
  conversations: ConversationResponse[];
  currentConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  onConversationCreated?: (conversationId: string) => void;
  isLoading?: boolean;
};

export function ConversationList({
  conversations,
  currentConversationId,
  onConversationSelect,
  onConversationCreated,
  isLoading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const userId = user?.id;
  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;

    const title = conv.conversation.title || "";
    const participants = conv.participants
      .map((p) => `${p.user.firstName} ${p.user.lastName}`)
      .join(" ");

    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participants.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Sort conversations by last activity
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aTime = new Date(a.conversation.lastActivity).getTime();
    const bTime = new Date(b.conversation.lastActivity).getTime();
    return bTime - aTime;
  });

  const getConversationDisplayName = (conversation: ConversationResponse) => {
    if (conversation.conversation.title) {
      return conversation.conversation.title;
    }

    // For direct conversations, show the other participant's name
    if (
      conversation.conversation.type === "direct" &&
      conversation.participants.length === 2
    ) {
      const otherParticipant = conversation.participants.find(
        (p) => p.user._id !== userId
      );
      if (otherParticipant) {
        return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
      }
    }

    // For group conversations, show participant names
    if (conversation.participants.length <= 3) {
      return conversation.participants.map((p) => p.user.firstName).join(", ");
    }

    return `${conversation.participants[0]?.user?.firstName} and ${conversation.participants.length - 1} others`;
  };

  const getConversationAvatar = (conversation: ConversationResponse) => {
    // For direct conversations, show the other participant's avatar
    if (
      conversation.conversation.type === "direct" &&
      conversation.participants.length === 2
    ) {
      const otherParticipant = conversation.participants.find(
        (p) => p.user._id !== userId
      );
      if (otherParticipant) {
        return {
          src: otherParticipant.user.avatar,
          fallback: `${otherParticipant.user.firstName[0]}${otherParticipant.user.lastName[0]}`,
        };
      }
    }

    // For group conversations, show group icon
    return {
      src: undefined,
      fallback: <Users className="h-4 w-4" />,
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            className="flex items-center space-x-3 p-3"
            key={`skeleton-${i.toString()}`}
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search and New Conversation */}
      <div className="space-y-3 border-b p-4">
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            value={searchQuery}
          />
        </div>
        <NewConversationDialog onConversationCreated={onConversationCreated}>
          <Button className="w-full" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Conversation
          </Button>
        </NewConversationDialog>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sortedConversations.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {searchQuery
                  ? "No conversations found"
                  : "No conversations yet"}
              </p>
              {!searchQuery && (
                <NewConversationDialog
                  onConversationCreated={onConversationCreated}
                >
                  <Button className="mt-2" size="sm" variant="link">
                    Start your first conversation
                  </Button>
                </NewConversationDialog>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {sortedConversations.map((conversation) => {
                const isSelected =
                  conversation.conversation._id === currentConversationId;
                const avatar = getConversationAvatar(conversation);
                const displayName = getConversationDisplayName(conversation);
                const lastMessage = conversation.lastMessage;
                const hasUnread = conversation.unreadCount > 0;

                return (
                  <button
                    className={cn(
                      "w-full rounded-lg p-3 text-left transition-colors hover:bg-muted/50",
                      isSelected && "bg-muted"
                    )}
                    key={conversation.conversation._id}
                    onClick={() =>
                      onConversationSelect(conversation.conversation._id || "")
                    }
                    type="button"
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        {avatar.src && <AvatarImage src={avatar.src} />}
                        <AvatarFallback>
                          {typeof avatar.fallback === "string"
                            ? avatar.fallback
                            : avatar.fallback}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="truncate font-medium text-sm">
                            {displayName}
                          </h4>
                          <div className="flex shrink-0 items-center space-x-2">
                            {lastMessage && (
                              <span className="text-muted-foreground text-xs">
                                {formatDistanceToNow(
                                  new Date(lastMessage.message.sentAt),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </span>
                            )}
                            {hasUnread && (
                              <Badge
                                className="flex h-5 w-5 items-center justify-center p-0 text-xs"
                                variant="destructive"
                              >
                                {conversation.unreadCount > 99
                                  ? "99+"
                                  : conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {lastMessage && (
                          <p className="mt-1 truncate text-muted-foreground text-sm">
                            <span className="font-medium">
                              {lastMessage.sender.firstName}:
                            </span>{" "}
                            {lastMessage.message.content}
                          </p>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className="text-xs" variant="outline">
                              {conversation.conversation.type}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              {conversation.participants.length} members
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
