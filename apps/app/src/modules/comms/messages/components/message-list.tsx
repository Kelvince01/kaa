/**
 * Message List
 *
 * Displays messages for a conversation with real-time updates
 */

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import { Check, CheckCheck, Edit, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMessages } from "../message.queries";
import { useMessageStore } from "../message.store";
import type { MessageResponse } from "../message.type";

type MessageListProps = {
  conversationId: string;
};

export function MessageList({ conversationId }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: messagesData, isLoading } = useMessages(
    conversationId,
    {},
    1,
    50,
    {
      enabled: !!conversationId,
    }
  );

  // Store state
  const { getMessages, getTypingUsers, isUserOnline } = useMessageStore();

  // Get messages from store (includes real-time updates)
  const messages = getMessages(conversationId);
  const typingUsers = getTypingUsers(conversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return format(date, "HH:mm");
    }
    if (diffInDays === 1) {
      return `Yesterday ${format(date, "HH:mm")}`;
    }
    if (diffInDays < 7) {
      return format(date, "EEE HH:mm");
    }
    return format(date, "MMM d, HH:mm");
  };

  // Group messages by date
  const groupMessagesByDate = (messages: MessageResponse[]) => {
    const groups: { [date: string]: MessageResponse[] } = {};

    for (const message of messages) {
      const date = format(new Date(message.message.sentAt), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    }

    return groups;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
            key={`loading-message-${i.toString()}`}
          >
            <div
              className={`flex max-w-xs space-x-2 ${i % 2 === 0 ? "" : "flex-row-reverse space-x-reverse"}`}
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-48" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <ScrollArea className="h-full" ref={scrollAreaRef}>
      <div className="space-y-4 p-4">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="my-6 flex items-center justify-center">
              <div className="rounded-full bg-muted px-3 py-1">
                <span className="text-muted-foreground text-xs">
                  {format(new Date(date), "MMMM d, yyyy")}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-4">
              {dateMessages.map((messageResponse, index) => {
                const { message, sender, isRead, canEdit, canDelete } =
                  messageResponse;
                const isCurrentUser = false; // This should come from auth context
                const showAvatar =
                  index === 0 ||
                  dateMessages[index - 1]?.sender._id !== sender._id ||
                  new Date(message.sentAt).getTime() -
                    new Date(
                      dateMessages[index - 1]?.message.sentAt ?? ""
                    ).getTime() >
                    5 * 60 * 1000;

                return (
                  <div
                    className={cn(
                      "group flex space-x-2",
                      isCurrentUser ? "justify-end" : "justify-start"
                    )}
                    key={message._id}
                  >
                    {!isCurrentUser && (
                      <div className="shrink-0">
                        {showAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={sender.avatar} />
                            <AvatarFallback>
                              {sender.firstName[0]}
                              {sender.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md xl:max-w-lg",
                        isCurrentUser ? "order-first" : ""
                      )}
                    >
                      {/* Sender name (only show if not current user and avatar is shown) */}
                      {!isCurrentUser && showAvatar && (
                        <div className="mb-1 flex items-center space-x-2">
                          <span className="font-medium text-sm">
                            {sender.firstName} {sender.lastName}
                          </span>
                          {isUserOnline(sender._id) && (
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                          )}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={cn(
                          "wrap-break-word rounded-lg px-3 py-2",
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                          message.isDeleted && "italic opacity-50"
                        )}
                      >
                        <p className="text-sm">
                          {message.isDeleted
                            ? "This message was deleted"
                            : message.content}
                        </p>

                        {/* Message attachments */}
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment) => (
                                <div
                                  className="flex items-center space-x-2 rounded bg-background/50 p-2"
                                  key={attachment._id}
                                >
                                  <div className="text-xs">
                                    📎 {attachment.filename}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>

                      {/* Message metadata */}
                      <div
                        className={cn(
                          "mt-1 flex items-center space-x-2 text-muted-foreground text-xs",
                          isCurrentUser ? "justify-end" : "justify-start"
                        )}
                      >
                        <span>{formatMessageTime(message.sentAt)}</span>
                        {isCurrentUser && (
                          <div className="flex items-center">
                            {isRead ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                        )}

                        {/* Message actions */}
                        {(canEdit || canDelete) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                size="sm"
                                variant="ghost"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEdit && !message.isDeleted && (
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-muted-foreground text-sm">
            <div className="flex space-x-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0]?.userName} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
