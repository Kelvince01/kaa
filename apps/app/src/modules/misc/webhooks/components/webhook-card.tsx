"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Copy,
  Edit,
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
  TestTube,
  Trash2,
} from "lucide-react";
import type { WebhookType } from "../webhook.type";

type WebhookCardProps = {
  webhook: WebhookType;
  onEdit?: (webhook: WebhookType) => void;
  onDelete?: (webhookId: string) => void;
  onTest?: (webhookId: string) => void;
  onActivate?: (webhookId: string) => void;
  onDeactivate?: (webhookId: string) => void;
  onViewDeliveries?: (webhookId: string) => void;
  onViewAnalytics?: (webhookId: string) => void;
  onRegenerateSecret?: (webhookId: string) => void;
};

export const WebhookCard = ({
  webhook,
  onEdit,
  onDelete,
  onTest,
  onActivate,
  onDeactivate,
  onViewDeliveries,
  onViewAnalytics,
  onRegenerateSecret,
}: WebhookCardProps) => {
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhook.url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {webhook.name}
              {webhook.isActive ? (
                <Badge className="ml-2" variant="default">
                  Active
                </Badge>
              ) : (
                <Badge className="ml-2" variant="secondary">
                  Inactive
                </Badge>
              )}
              <Badge variant="outline">{webhook.environment}</Badge>
              <Badge variant="outline">{webhook.priority}</Badge>
            </CardTitle>
            {webhook.description && (
              <CardDescription>{webhook.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(webhook)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onTest && (
                <DropdownMenuItem onClick={() => onTest(webhook._id)}>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Webhook
                </DropdownMenuItem>
              )}
              {webhook.isActive && onDeactivate ? (
                <DropdownMenuItem onClick={() => onDeactivate(webhook._id)}>
                  <Pause className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                onActivate && (
                  <DropdownMenuItem onClick={() => onActivate(webhook._id)}>
                    <Play className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                )
              )}
              {onViewDeliveries && (
                <DropdownMenuItem onClick={() => onViewDeliveries(webhook._id)}>
                  <Activity className="mr-2 h-4 w-4" />
                  View Deliveries
                </DropdownMenuItem>
              )}
              {onViewAnalytics && (
                <DropdownMenuItem onClick={() => onViewAnalytics(webhook._id)}>
                  <Activity className="mr-2 h-4 w-4" />
                  View Analytics
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onRegenerateSecret && (
                <DropdownMenuItem
                  onClick={() => onRegenerateSecret(webhook._id)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Secret
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(webhook._id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">URL:</span>
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-xs">
              {webhook.url}
            </code>
            <Button
              className="h-6 w-6"
              onClick={handleCopyUrl}
              size="icon"
              variant="ghost"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Method:</span>
          <Badge variant="outline">{webhook.method}</Badge>
        </div>

        <div className="space-y-2">
          <span className="text-muted-foreground text-sm">Events:</span>
          <div className="flex flex-wrap gap-1">
            {webhook.events.slice(0, 3).map((event) => (
              <Badge className="text-xs" key={event} variant="secondary">
                {event}
              </Badge>
            ))}
            {webhook.events.length > 3 && (
              <Badge className="text-xs" variant="secondary">
                +{webhook.events.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {webhook.tags && webhook.tags.length > 0 && (
          <div className="space-y-2">
            <span className="text-muted-foreground text-sm">Tags:</span>
            <div className="flex flex-wrap gap-1">
              {webhook.tags.map((tag) => (
                <Badge className="text-xs" key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-muted-foreground text-xs">
        <div className="flex w-full justify-between">
          <span>
            Created {formatDistanceToNow(new Date(webhook.createdAt))} ago
          </span>
          {webhook.lastTriggered && (
            <span>
              Last triggered{" "}
              {formatDistanceToNow(new Date(webhook.lastTriggered))} ago
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
