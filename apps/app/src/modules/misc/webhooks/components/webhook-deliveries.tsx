"use client";

import { WebhookStatus } from "@kaa/models/types";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { WebhookDeliveryType } from "../webhook.type";

type WebhookDeliveriesProps = {
  deliveries: WebhookDeliveryType[];
  isLoading?: boolean;
  onRedeliver?: (deliveryId: string) => void;
  onViewDetails?: (delivery: WebhookDeliveryType) => void;
};

const getStatusIcon = (status: WebhookStatus) => {
  switch (status) {
    case WebhookStatus.DELIVERED:
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case WebhookStatus.FAILED:
      return <XCircle className="h-4 w-4 text-red-500" />;
    case WebhookStatus.PENDING:
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case WebhookStatus.PROCESSING:
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    case WebhookStatus.RETRYING:
      return <RefreshCw className="h-4 w-4 text-orange-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: WebhookStatus) => {
  const variants: Record<
    WebhookStatus,
    "default" | "destructive" | "secondary" | "outline"
  > = {
    [WebhookStatus.DELIVERED]: "default",
    [WebhookStatus.FAILED]: "destructive",
    [WebhookStatus.PENDING]: "secondary",
    [WebhookStatus.PROCESSING]: "outline",
    [WebhookStatus.RETRYING]: "outline",
    [WebhookStatus.CANCELLED]: "secondary",
    [WebhookStatus.EXPIRED]: "secondary",
  };

  return (
    <Badge className="flex w-fit items-center gap-1" variant={variants[status]}>
      {getStatusIcon(status)}
      {status}
    </Badge>
  );
};

export const WebhookDeliveries = ({
  deliveries,
  isLoading = false,
  onRedeliver,
  onViewDetails,
}: WebhookDeliveriesProps) => {
  if (deliveries.length === 0 && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Deliveries</CardTitle>
          <CardDescription>
            No webhook deliveries have been attempted yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery History</CardTitle>
        <CardDescription>
          Track the status of webhook delivery attempts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Attempt</TableHead>
              <TableHead>HTTP Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.map((delivery) => (
              <TableRow key={delivery._id}>
                <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                <TableCell>
                  <Badge variant="outline">#{delivery.attempt}</Badge>
                </TableCell>
                <TableCell>
                  {delivery.httpStatus ? (
                    <Badge
                      variant={
                        delivery.httpStatus >= 200 && delivery.httpStatus < 300
                          ? "default"
                          : "destructive"
                      }
                    >
                      {delivery.httpStatus}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {delivery.duration ? (
                    `${delivery.duration}ms`
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(delivery.startedAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onViewDetails && (
                      <Button
                        onClick={() => onViewDetails(delivery)}
                        size="sm"
                        variant="ghost"
                      >
                        Details
                      </Button>
                    )}
                    {onRedeliver &&
                      delivery.status === WebhookStatus.FAILED && (
                        <Button
                          onClick={() => onRedeliver(delivery._id)}
                          size="sm"
                          variant="outline"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Retry
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
