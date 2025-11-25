import { useAuthStore } from "@/modules/auth/auth.store";

export function DashboardOverview() {
  const { user } = useAuthStore();

  return (
    <div>
      <h1 className="font-bold font-heading text-2xl text-emerald-900">
        Welcome back, {user?.firstName}!
      </h1>
      <p className="text-emerald-600">
        Your smart home dashboard powered by AI -{" "}
        <span className="text-muted-foreground">
          Here's an overview of your rental and activities
        </span>
      </p>
    </div>
  );
}
