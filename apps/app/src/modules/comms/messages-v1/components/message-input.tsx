"use client";

import { Button } from "@kaa/ui/components/button";
import { Input } from "@kaa/ui/components/input";
import { Textarea } from "@kaa/ui/components/textarea";
import { File, Paperclip, Send, X } from "lucide-react";
import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { MessageAttachment } from "../message.type";

type LocalAttachment = {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
};

type MessageInputProps = {
  onSendMessage: (content: string, attachments?: MessageAttachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  multiline?: boolean;
};

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  multiline = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea if multiline
  useEffect(() => {
    if (multiline && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [multiline]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();

    if (!message.trim() && attachments.length === 0) return;

    // Convert local attachments to API format
    const apiAttachments: MessageAttachment[] = attachments.map(
      (attachment) => ({
        url: attachment.previewUrl || "",
        filename: attachment.name,
        contentType: attachment.type,
        size: attachment.size,
        name: attachment.name,
        type: attachment.type,
      })
    );

    onSendMessage(message.trim(), apiAttachments);

    // Reset form
    setMessage("");
    setAttachments([]);
    setIsAttaching(false);

    // Reset textarea height if multiline
    if (multiline && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Submit on Enter (or Ctrl/Cmd+Enter for multiline)
    if (
      e.key === "Enter" &&
      (!multiline || (multiline && (e.ctrlKey || e.metaKey)))
    ) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const newAttachments: LocalAttachment[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2),
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsAttaching(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    const attachment = attachments.find((a) => a.id === id);
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }

    const filtered = attachments.filter((a) => a.id !== id);
    setAttachments(filtered);

    if (filtered.length === 0) {
      setIsAttaching(false);
    }
  };

  return (
    <div className="border-t">
      {/* Attachments preview */}
      {isAttaching && attachments.length > 0 && (
        <div className="border-b bg-muted/50 p-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div className="relative" key={attachment.id}>
                {attachment.previewUrl ? (
                  <div className="relative h-16 w-16">
                    <Image
                      alt={attachment.name}
                      className="h-full w-full rounded-md object-cover"
                      height={64}
                      src={attachment.previewUrl}
                      width={64}
                    />
                    <button
                      className="-right-1 -top-1 absolute rounded-full bg-destructive p-0.5 text-destructive-foreground shadow-sm"
                      onClick={() => removeAttachment(attachment.id)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center rounded-md border bg-background p-2 pr-8">
                    <File className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span className="max-w-[100px] truncate text-xs">
                      {attachment.name}
                    </span>
                    <button
                      className="-translate-y-1/2 absolute top-1/2 right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                      onClick={() => removeAttachment(attachment.id)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      <form className="p-4" onSubmit={handleSubmit}>
        <div className="flex items-end space-x-2">
          {/* Attachment button */}
          <Button
            className="mb-0.5"
            disabled={disabled}
            onClick={handleAttachmentClick}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Hidden file input */}
          <input
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            ref={fileInputRef}
            type="file"
          />

          {/* Text input */}
          {multiline ? (
            <Textarea
              className="min-h-[40px] flex-1 resize-none"
              disabled={disabled}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              ref={textareaRef}
              rows={1}
              value={message}
            />
          ) : (
            <Input
              className="flex-1"
              disabled={disabled}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              value={message}
            />
          )}

          {/* Send button */}
          <Button
            className="mb-0.5"
            disabled={disabled || (!message.trim() && attachments.length === 0)}
            size="icon"
            type="submit"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Hint for multiline */}
        {multiline && (
          <p className="mt-1 text-muted-foreground text-xs">
            Press Ctrl+Enter to send
          </p>
        )}
      </form>
    </div>
  );
}
