import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Switch } from "@kaa/ui/components/switch";
import { cn } from "@kaa/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  RefreshCw,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ChartRefresherProps = {
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  lastUpdated?: Date;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAutoRefreshChange?: (enabled: boolean) => void;
  onIntervalChange?: (interval: number) => void;
  className?: string;
};

type RefreshStatus = {
  status: "idle" | "refreshing" | "success" | "error";
  lastRefresh?: Date;
  nextRefresh?: Date;
  errorMessage?: string;
};

const refreshIntervals = [
  { label: "30 seconds", value: 30, icon: Zap },
  { label: "1 minute", value: 60, icon: Activity },
  { label: "5 minutes", value: 300, icon: Clock },
  { label: "15 minutes", value: 900, icon: Clock },
  { label: "30 minutes", value: 1800, icon: Clock },
  { label: "1 hour", value: 3600, icon: Clock },
];

export function ChartRefresher({
  onRefresh,
  isRefreshing = false,
  lastUpdated,
  autoRefresh = false,
  refreshInterval = 300, // 5 minutes default
  onAutoRefreshChange,
  onIntervalChange,
  className,
}: ChartRefresherProps) {
  const [status, setStatus] = useState<RefreshStatus>({ status: "idle" });
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number>(0);
  const [refreshCount, setRefreshCount] = useState(0);

  // Calculate next refresh time
  const getNextRefreshTime = useCallback(() => {
    if (!(lastUpdated && autoRefresh)) return null;
    return new Date(lastUpdated.getTime() + refreshInterval * 1000);
  }, [lastUpdated, autoRefresh, refreshInterval]);

  // Handle manual refresh
  const handleManualRefresh = async () => {
    try {
      setStatus({ status: "refreshing" });
      await onRefresh();
      const now = new Date();
      setStatus({
        status: "success",
        lastRefresh: now,
        nextRefresh: autoRefresh
          ? new Date(now.getTime() + refreshInterval * 1000)
          : undefined,
      });
      setRefreshCount((prev) => prev + 1);
    } catch (error) {
      setStatus({
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Refresh failed",
      });
    }
  };

  // Auto refresh effect
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    if (!autoRefresh || isRefreshing) return;

    const interval = setInterval(() => {
      const nextRefresh = getNextRefreshTime();
      if (!nextRefresh) return;

      const now = new Date();
      const timeLeft = Math.max(
        0,
        Math.floor((nextRefresh.getTime() - now.getTime()) / 1000)
      );

      setTimeUntilRefresh(timeLeft);

      if (timeLeft === 0) {
        handleManualRefresh();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    autoRefresh,
    isRefreshing,
    refreshInterval,
    lastUpdated,
    getNextRefreshTime,
  ]);

  // Format time until next refresh
  const formatTimeUntilRefresh = (seconds: number): string => {
    if (seconds === 0) return "Refreshing...";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (status.status) {
      case "refreshing":
        return {
          icon: RefreshCw,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          text: "Refreshing...",
        };
      case "success":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          text: "Updated",
        };
      case "error":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          text: "Error",
        };
      default:
        return {
          icon: Activity,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          text: "Ready",
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const selectedInterval = refreshIntervals.find(
    (i) => i.value === refreshInterval
  );
  const IntervalIcon = selectedInterval?.icon || Clock;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <Activity className="mr-2 h-4 w-4" />
            Real-time Updates
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              className={cn(
                "text-xs",
                statusDisplay.bgColor,
                statusDisplay.color
              )}
              variant="secondary"
            >
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusDisplay.text}
            </Badge>
            {refreshCount > 0 && (
              <Badge className="text-xs" variant="outline">
                {refreshCount} updates
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Manual Refresh */}
        <div className="flex items-center justify-between">
          <Button
            disabled={isRefreshing || status.status === "refreshing"}
            onClick={handleManualRefresh}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={cn(
                "mr-2 h-4 w-4",
                (isRefreshing || status.status === "refreshing") &&
                  "animate-spin"
              )}
            />
            Refresh Now
          </Button>

          {lastUpdated && (
            <div className="text-muted-foreground text-xs">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </div>
          )}
        </div>

        {/* Auto Refresh Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              id="auto-refresh"
              onCheckedChange={onAutoRefreshChange}
            />
            <Label className="font-medium text-sm" htmlFor="auto-refresh">
              Auto-refresh
            </Label>
          </div>

          {autoRefresh && (
            <div className="flex items-center space-x-1 text-muted-foreground text-xs">
              {timeUntilRefresh > 0 ? (
                <>
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeUntilRefresh(timeUntilRefresh)}</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span>Active</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Refresh Interval Selection */}
        {autoRefresh && (
          <div>
            <Label className="mb-2 block font-medium text-sm">
              Refresh Interval
            </Label>
            <Select
              onValueChange={(value) =>
                onIntervalChange?.(Number.parseInt(value, 10))
              }
              value={refreshInterval.toString()}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <IntervalIcon className="mr-2 h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {refreshIntervals.map((interval) => {
                  const Icon = interval.icon;
                  return (
                    <SelectItem
                      key={interval.value}
                      value={interval.value.toString()}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-2 h-4 w-4" />
                        {interval.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Status Information */}
        {status.status === "error" && status.errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <div className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
              <div className="text-sm">
                <div className="font-medium text-red-800">Refresh Failed</div>
                <div className="mt-1 text-red-700">{status.errorMessage}</div>
              </div>
            </div>
          </div>
        )}

        {/* Next Refresh Info */}
        {autoRefresh &&
          status.nextRefresh &&
          status.status !== "refreshing" && (
            <div className="rounded-md bg-muted/30 p-2 text-muted-foreground text-xs">
              <div className="flex items-center justify-between">
                <span>Next refresh:</span>
                <span className="font-mono">
                  {status.nextRefresh.toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

        {/* Performance Info */}
        {refreshCount > 0 && (
          <div className="border-t pt-3 text-muted-foreground text-xs">
            <div className="flex items-center justify-between">
              <span>Updates this session:</span>
              <Badge className="text-xs" variant="outline">
                {refreshCount}
              </Badge>
            </div>
            {status.lastRefresh && (
              <div className="mt-1 flex items-center justify-between">
                <span>Last successful update:</span>
                <span className="font-mono">
                  {status.lastRefresh.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
