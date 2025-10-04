"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { useRouter } from "next/navigation";
import { RoleAssignmentForm } from "@/modules/rbac/components/role-assignment-form";

export default function RoleAssignmentPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Assign Role to User</CardTitle>
          <CardDescription>
            Assign roles to users with context and optional expiry dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleAssignmentForm
            onCancel={() => {
              router.back();
            }}
            onSuccess={() => {
              router.push("/admin/rbac/roles");
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
