"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Input } from "@kaa/ui/components/input";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { cn } from "@kaa/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProcessedConversation } from "../conversation.type";

type ConversationListProps = {
  conversations: ProcessedConversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  isLoading?: boolean;
};

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoading = false,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConversations, setFilteredConversations] = useState<
    ProcessedConversation[]
  >([]);

  // Filter conversations based on search term
  useEffect(() => {
    if (!conversations) {
      setFilteredConversations([]);
      return;
    }

    if (!searchTerm) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter((conversation) => {
      const otherParticipant = conversation.otherParticipant;
      const participantName = otherParticipant
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : "";
      const title = conversation.title || "";

      return (
        participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredConversations(filtered);
  }, [searchTerm, conversations]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col border-r">
        <div className="border-b p-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                className="flex items-center space-x-3 p-4"
                key={i.toString()}
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Empty state
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex h-full flex-col border-r">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations"
              type="text"
              value={searchTerm}
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 font-medium text-sm">No conversations yet</p>
          <p className="text-muted-foreground text-xs">
            Start a conversation by viewing a property and contacting the
            landlord
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-r">
      {/* Search bar */}
      <div className="border-b p-4">
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations"
            type="text"
            value={searchTerm}
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredConversations.map((conversation) => {
            const otherParticipant = conversation.otherParticipant;
            const lastMessage = conversation.lastMessage;
            const formattedDate =
              lastMessage &&
              typeof lastMessage === "object" &&
              "createdAt" in lastMessage
                ? formatDistanceToNow(new Date(lastMessage.createdAt), {
                    addSuffix: true,
                  })
                : "";

            // Get unread count
            const unreadCount = conversation.unreadCount
              ? typeof conversation.unreadCount === "object"
                ? Object.values(conversation.unreadCount).reduce(
                    (a, b) => a + b,
                    0
                  )
                : 0
              : 0;

            return (
              <button
                className={cn(
                  "flex w-full items-start space-x-3 p-4 text-left transition-colors hover:bg-muted/50",
                  activeConversationId === conversation._id && "bg-muted"
                )}
                key={conversation._id}
                onClick={() => onSelectConversation(conversation._id)}
                type="button"
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  {otherParticipant?.avatar && (
                    <AvatarImage src={otherParticipant.avatar} />
                  )}
                  <AvatarFallback>
                    {otherParticipant
                      ? `${otherParticipant.firstName[0]}${otherParticipant.lastName[0]}`
                      : "?"}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate font-medium text-sm">
                      {otherParticipant
                        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
                        : conversation.title || "Conversation"}
                    </h3>
                    <span className="text-muted-foreground text-xs">
                      {formattedDate}
                    </span>
                  </div>

                  {/* Property title if available */}
                  {conversation.property &&
                    typeof conversation.property === "object" && (
                      <p className="mt-0.5 truncate text-primary text-xs">
                        {conversation.property.title}
                      </p>
                    )}

                  {/* Last message preview */}
                  <p
                    className={cn(
                      "mt-1 truncate text-sm",
                      unreadCount > 0 ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {lastMessage &&
                    typeof lastMessage === "object" &&
                    "content" in lastMessage
                      ? lastMessage.content
                      : "No messages yet"}
                  </p>
                </div>

                {/* Unread badge */}
                {unreadCount > 0 && (
                  <Badge className="ml-auto" variant="destructive">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
