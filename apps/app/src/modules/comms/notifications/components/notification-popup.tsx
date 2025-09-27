import { Icon } from "@iconify/react";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { Separator } from "@kaa/ui/components/separator";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { cn } from "@kaa/ui/lib/utils";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCircle,
  DollarSign,
  Heart,
  Home,
  MessageCircle,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
} from "../notification.queries";
import { useNotificationStore } from "../notification.store";
import type { Notification, NotificationType } from "../notification.type";

// UI-specific simplified notification type for icon display
type UINotificationType =
  | "message"
  | "property"
  | "booking"
  | "favorite"
  | "payment"
  | "system"
  | "alert";

// Helper function to map API notification types to UI types
const mapToUIType = (apiType: NotificationType): UINotificationType => {
  if (apiType.includes("message")) return "message";
  if (apiType.includes("property")) return "property";
  if (apiType.includes("viewing") || apiType.includes("booking"))
    return "booking";
  if (apiType.includes("favorite")) return "favorite";
  if (apiType.includes("payment")) return "payment";
  if (apiType === "system") return "system";
  if (apiType.includes("alert")) return "alert";
  return "system"; // Default fallback
};

type NotificationIconProps = {
  type: NotificationType;
};

const NotificationIcon: React.FC<NotificationIconProps> = ({ type }) => {
  const uiType = mapToUIType(type);

  // biome-ignore lint/nursery/noUnnecessaryConditions: false positive
  switch (uiType) {
    case "booking":
      return <Calendar className="h-5 w-5 text-purple-500" />;
    case "message":
      return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case "property":
      return <Home className="h-5 w-5 text-green-500" />;
    case "favorite":
      return <Heart className="h-5 w-5 text-red-500" />;
    case "payment":
      return <DollarSign className="h-5 w-5 text-yellow-500" />;
    case "system":
      return <Settings className="h-5 w-5 text-gray-500" />;
    case "alert":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const router = useRouter();

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
      // biome-ignore lint/style/noUselessElse: false positive
    } else if (isYesterday(date)) {
      return "Yesterday";
      // biome-ignore lint/style/noUselessElse: false positive
    } else {
      return format(date, "MMM d, yyyy");
    }
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: false positive
    // biome-ignore lint/a11y/noStaticElementInteractions: false positive
    // biome-ignore lint/a11y/useKeyWithClickEvents: false positive
    <div
      className={cn(
        "group relative cursor-pointer border-b p-4 transition-colors hover:bg-accent/50",
        notification.isRead ? "bg-background" : "bg-accent/30"
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-4 left-2 h-2 w-2 rounded-full bg-primary" />
      )}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
          <NotificationIcon type={notification.type} />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "text-sm leading-tight",
                notification.isRead
                  ? "text-muted-foreground"
                  : "font-medium text-foreground"
              )}
            >
              {notification.title}
            </h4>
            <span className="whitespace-nowrap text-muted-foreground text-xs">
              {formatNotificationDate(notification.createdAt)}
            </span>
          </div>
          <p className="line-clamp-2 text-muted-foreground text-sm">
            {notification.message}
          </p>
          {notification.link && (
            <p className="text-primary text-xs">Click to view</p>
          )}
        </div>

        <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!notification.isRead && (
            <Button
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification._id);
              }}
              size="sm"
              title="Mark as read"
              variant="ghost"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}

          <Button
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification._id);
            }}
            size="sm"
            title="Delete notification"
            variant="ghost"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const NotificationPopover = () => {
  const router = useRouter();
  const notificationStore = useNotificationStore();

  // React Query hooks
  const { data: notificationsData, isLoading } = useNotifications();
  const { data: unreadCountData } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const deleteAllNotificationsMutation = useDeleteAllNotifications();

  // Extract data from queries
  const notifications = notificationsData?.items || [];
  const unreadCount = unreadCountData?.data?.unreadCount || 0;
  const loading = isLoading;

  const [isOpen, setIsOpen] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Request browser notification permission
  useEffect(() => {
    if (!hasRequestedPermission && "Notification" in window) {
      const requestPermission = async () => {
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          setHasRequestedPermission(true);
        }
      };

      requestPermission();
    }
  }, [hasRequestedPermission]);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
    notificationStore.setNotificationCenterOpen(!isOpen);
  };

  const handleMarkAllAsRead = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    markAllAsReadMutation.mutate();
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate({ notificationId: id });
  };

  const handleDelete = (id: string) => {
    deleteNotificationMutation.mutate({ notificationId: id });
  };

  const handleClearAll = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    deleteAllNotificationsMutation.mutate();
  };

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="View notifications"
          className="relative h-8 w-8 rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          size="sm"
          variant="outline"
        >
          <Icon className="h-4 w-4" icon="material-symbols:notifications" />
          {unreadCount > 0 && (
            <Badge
              className="-top-1 -right-1 absolute h-5 w-5 rounded-full p-0 font-bold text-xs"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 md:w-96" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="h-5" variant="secondary">
                {unreadCount}
              </Badge>
            )}
          </div>

          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                className="h-8 text-xs"
                disabled={markAllAsReadMutation.isPending}
                onClick={handleMarkAllAsRead}
                size="sm"
                variant="ghost"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                {markAllAsReadMutation.isPending
                  ? "Marking..."
                  : "Mark all read"}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                className="h-8 text-muted-foreground text-xs hover:text-destructive"
                disabled={deleteAllNotificationsMutation.isPending}
                onClick={handleClearAll}
                size="sm"
                variant="ghost"
              >
                <X className="mr-1 h-3 w-3" />
                {deleteAllNotificationsMutation.isPending
                  ? "Clearing..."
                  : "Clear all"}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-full space-y-3">
                {[new Array(3)].map((_, i) => (
                  <div
                    className="flex items-start gap-3 p-4"
                    key={`skeleton-${i + 1}`}
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 rounded-full bg-muted p-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="mb-1 font-medium text-foreground">
                No notifications yet
              </h4>
              <p className="text-muted-foreground text-sm">
                We'll notify you when something important happens
              </p>
            </div>
          ) : (
            notifications.map((notification: Notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onDelete={handleDelete}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                asChild
                className="w-full justify-center text-xs"
                size="sm"
                variant="ghost"
              >
                <Link
                  href="/notifications/settings"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="mr-1 h-3 w-3" />
                  Notification Settings
                </Link>
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
