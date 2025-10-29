"use client";

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
import { Mail, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { useRemoveMemberFromOrganization } from "../organization.mutations";
import type { Organization } from "../organization.type";
import { AddMemberDialog } from "./add-member-dialog";

type OrganizationMembersProps = {
  organization: Organization;
};

export function OrganizationMembers({
  organization,
}: OrganizationMembersProps) {
  const removeMember = useRemoveMemberFromOrganization();

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember.mutateAsync({
        orgId: organization._id,
        memberId,
      });
      toast.success("Member removed from organization successfully");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member. Please try again.");
    }
  };

  const members: any[] = organization.members || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Manage members in this organization
            </CardDescription>
          </div>
          <AddMemberDialog organization={organization} />
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <User className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 font-medium text-sm">No members yet</p>
            <p className="mb-4 text-muted-foreground text-sm">
              Add members to start collaborating on this organization
            </p>
            <AddMemberDialog organization={organization} />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const userId =
                    typeof member.user === "string"
                      ? member.user
                      : member.user?._id || "";
                  const userEmail =
                    typeof member.user === "object" && member.user?.email
                      ? member.user.email
                      : "Unknown";
                  const userName =
                    typeof member.user === "object" && member.user?.name
                      ? member.user.name
                      : "Unknown User";

                  return (
                    <TableRow key={userId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{userName}</span>
                          {userEmail !== "Unknown" && (
                            <span className="flex items-center gap-1 text-muted-foreground text-sm">
                              <Mail className="h-3 w-3" />
                              {userEmail}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {member.role?.name || "Member"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          disabled={removeMember.isPending}
                          onClick={() => handleRemoveMember(userId)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
