import { useAuthStore } from "@/modules/auth/auth.store";

export function DashboardOverview() {
  const { user } = useAuthStore();

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-bold font-heading text-2xl text-emerald-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-emerald-600">
            Your smart home dashboard powered by AI
          </p>
        </div>
      </div>
    </div>
  );
}
