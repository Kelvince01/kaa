import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { cn } from "@kaa/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Cloud,
  CloudOff,
  Save,
  Wifi,
  WifiOff,
} from "lucide-react";

type FormState = {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: Date;
  hasUnsavedChanges: boolean;
  saveError?: string;
  connectionStatus: "online" | "offline" | "unstable";
};

type SaveIndicatorProps = {
  formState: FormState;
  onSaveNow?: () => void;
  onRecoverDraft?: () => void;
  className?: string;
};

export function SaveIndicator({
  formState,
  onSaveNow,
  onRecoverDraft,
  className,
}: SaveIndicatorProps) {
  const getSaveStatus = () => {
    if (formState.connectionStatus === "offline") {
      return {
        icon: <CloudOff className="h-3 w-3" />,
        text: "Offline - Saved locally",
        variant: "secondary" as const,
        color: "text-gray-600",
      };
    }

    if (formState.isSaving) {
      return {
        icon: <Clock className="h-3 w-3 animate-spin" />,
        text: "Saving...",
        variant: "secondary" as const,
        color: "text-blue-600",
      };
    }

    if (formState.saveError) {
      return {
        icon: <AlertTriangle className="h-3 w-3" />,
        text: "Save failed",
        variant: "destructive" as const,
        color: "text-red-600",
      };
    }

    if (formState.hasUnsavedChanges) {
      return {
        icon: <Clock className="h-3 w-3" />,
        text: "Unsaved changes",
        variant: "outline" as const,
        color: "text-amber-600",
      };
    }

    if (formState.lastSaved) {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        text: `Saved ${formatDistanceToNow(formState.lastSaved, { addSuffix: true })}`,
        variant: "secondary" as const,
        color: "text-green-600",
      };
    }

    return {
      icon: <Save className="h-3 w-3" />,
      text: "Not saved",
      variant: "outline" as const,
      color: "text-gray-600",
    };
  };

  const status = getSaveStatus();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Connection Status */}
      <div className="flex items-center gap-1">
        {formState.connectionStatus === "online" ? (
          <Wifi className="h-3 w-3 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-500" />
        )}
      </div>

      {/* Save Status Badge */}
      <Badge className="gap-1" variant={status.variant}>
        {status.icon}
        <span className={cn("text-xs", status.color)}>{status.text}</span>
      </Badge>

      {/* Action Buttons */}
      {formState.hasUnsavedChanges && onSaveNow && (
        <Button
          className="h-6 px-2 text-xs"
          disabled={formState.isSaving}
          onClick={onSaveNow}
          size="sm"
          variant="outline"
        >
          <Save className="mr-1 h-3 w-3" />
          Save Now
        </Button>
      )}

      {formState.saveError && onRecoverDraft && (
        <Button
          className="h-6 px-2 text-xs"
          onClick={onRecoverDraft}
          size="sm"
          variant="outline"
        >
          <Cloud className="mr-1 h-3 w-3" />
          Recover
        </Button>
      )}
    </div>
  );
}
