import { Button } from "@kaa/ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/modules/auth/auth.store";

export function DashboardOverview() {
  const { user } = useAuthStore();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-bold font-heading text-2xl text-emerald-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-emerald-600">Manage your properties efficiently</p>
      </div>
      <Link href="/dashboard/properties/create">
        <Button className="bg-accent text-white hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </Link>
    </div>
  );
}
