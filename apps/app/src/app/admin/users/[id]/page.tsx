// apps/app/src/app/admin/users/[userId]/page.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { useParams } from "next/navigation";
import { UserRolesManagement } from "@/modules/rbac/components/user-roles-mgt-sheet";
import { useUser } from "@/modules/users/user.queries";

export default function UserDetailPage() {
  const { userId } = useParams();
  const { data: userData, isLoading } = useUser(userId as string);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* User Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">
            {userData?.firstName} {userData?.lastName}
          </h1>
          <p className="text-muted-foreground">{userData?.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="font-medium text-muted-foreground text-sm">
                  Status
                </dt>
                <dd className="text-sm">{userData?.status}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground text-sm">
                  Phone
                </dt>
                <dd className="text-sm">{userData?.phone}</dd>
              </div>
              {/* More fields... */}
            </dl>
          </CardContent>
        </Card>

        {/* Roles Management Card */}
        <UserRolesManagement userId={userId as string} />
      </div>

      {/* Other sections... */}
    </div>
  );
}
