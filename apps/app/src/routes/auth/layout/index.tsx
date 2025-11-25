import { useTranslations } from "next-intl";

export const AuthLayoutContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const t = useTranslations("auth.metadata");

  return (
    <div className="relative block min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzA1OTY2OSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-60" />
      <div className="absolute top-20 left-20 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-teal-500/6 blur-3xl" />
      {children}
    </div>
  );
};
