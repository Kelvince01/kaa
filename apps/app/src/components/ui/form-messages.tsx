import { cn } from "@kaa/ui/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import * as React from "react";

interface FormMessagesProps extends React.HTMLAttributes<HTMLDivElement> {
  messages?: string[] | string | React.ReactNode;
  type?: "error" | "success";
}

export function FormMessages({
  messages,
  type = "error",
  className,
  ...props
}: FormMessagesProps) {
  if (!messages) {
    return null;
  }

  const isReactNode = React.isValidElement(messages);

  if (!isReactNode && typeof messages === "string") {
    messages = [messages];
  }

  return (
    <div
      aria-invalid={type === "error"}
      className={cn(
        "flex flex-col text-destructive text-sm",
        type === "success" && "text-muted-foreground",
        className
      )}
      {...props}
    >
      {isReactNode
        ? messages
        : (messages as string[]).map((value, i) => (
            <div className="flex gap-2" key={i.toString()}>
              {type === "error" ? (
                <XCircle className="relative top-0.5 size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="relative top-0.5 size-4 shrink-0" />
              )}
              <p>{value}</p>
            </div>
          ))}
    </div>
  );
}
