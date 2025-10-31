/**
 * Message Input
 *
 * Input component for sending messages with attachments and typing indicators
 */

"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card } from "@kaa/ui/components/card";
import { Textarea } from "@kaa/ui/components/textarea";
import { Paperclip, Send, Smile, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/modules/auth/use-auth";
import { useWebSocketMessages } from "../hooks";
import { useSendMessage } from "../message.queries";
import { useMessageStore } from "../message.store";
import { AttachmentType } from "../message.type";

type MessageInputProps = {
  conversationId: string;
  onSendMessage?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

export function MessageInput({
  conversationId,
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user, getAccessToken } = useAuth();
  const userId = user?.id;

  const { isWebSocketConnected } = useMessageStore();

  // WebSocket hook
  const { sendTypingIndicator, isConnected } = useWebSocketMessages({
    userId: userId || "",
    enabled: !!conversationId,
    token: getAccessToken() || "",
  });

  // Mutations
  const sendMessageMutation = useSendMessage();

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isConnected || isTyping) return;

    setIsTyping(true);
    sendTypingIndicator(conversationId, true);
  }, [conversationId, isConnected, isTyping, sendTypingIndicator]);

  const handleTypingStop = useCallback(() => {
    if (!isTyping) return;

    setIsTyping(false);
    sendTypingIndicator(conversationId, false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [conversationId, isTyping, sendTypingIndicator]);

  // Handle input change with typing indicators
  const handleInputChange = (value: string) => {
    setMessage(value);

    if (value.trim()) {
      handleTypingStart();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 2000);
    } else {
      handleTypingStop();
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
    // Reset input
    event.target.value = "";
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle send message
  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;

    // Stop typing indicator
    handleTypingStop();

    try {
      // Prepare attachments for API
      const attachmentData = attachments.map((file) => ({
        file,
        type: getAttachmentType(file),
      }));

      // Send message
      const result = await sendMessageMutation.mutateAsync({
        conversationId,
        content: trimmedMessage,
        attachments: attachmentData.length > 0 ? attachmentData : undefined,
      });

      // Clear input
      setMessage("");
      setAttachments([]);
      onSendMessage?.();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  // Cleanup typing timeout on unmount
  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      handleTypingStop();
    },
    [handleTypingStop]
  );

  // Determine attachment type from file
  const getAttachmentType = (file: File): AttachmentType => {
    if (file.type.startsWith("image/")) return AttachmentType.IMAGE;
    if (file.type.startsWith("video/")) return AttachmentType.VIDEO;
    if (file.type.startsWith("audio/")) return AttachmentType.AUDIO;
    if (file.type.includes("pdf") || file.type.includes("document"))
      return AttachmentType.DOCUMENT;
    return AttachmentType.OTHER;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const canSend =
    (message.trim() || attachments.length > 0) &&
    !sendMessageMutation.isPending;

  return (
    <div className="space-y-3">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <Card
              className="flex items-center space-x-2 p-2"
              key={`${file.name}-${file.size}-${index}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{file.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                className="h-6 w-6 p-0"
                onClick={() => removeAttachment(index)}
                size="sm"
                variant="ghost"
              >
                <X className="h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-2">
        {/* File attachment button */}
        <Button
          className="shrink-0"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          size="sm"
          variant="ghost"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Message input */}
        <div className="relative flex-1">
          <Textarea
            className="max-h-[120px] min-h-[40px] resize-none pr-12"
            disabled={disabled}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            ref={textareaRef}
            rows={1}
            value={message}
          />

          {/* Emoji button (placeholder) */}
          <Button
            className="absolute right-2 bottom-2 h-6 w-6 p-0"
            disabled={disabled}
            size="sm"
            variant="ghost"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        {/* Send button */}
        <Button
          className="shrink-0"
          disabled={!canSend || disabled}
          onClick={handleSendMessage}
          size="sm"
        >
          <Send className="h-4 w-4" />
        </Button>

        {/* Hidden file input */}
        <input
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          className="hidden"
          multiple
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />
      </div>

      {/* Status indicators */}
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <div className="flex items-center space-x-4">
          {sendMessageMutation.isPending && <span>Sending...</span>}
          {isTyping && isWebSocketConnected && (
            <span className="text-green-600">Typing...</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!isConnected && (
            <Badge className="text-xs" variant="secondary">
              Offline
            </Badge>
          )}
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
