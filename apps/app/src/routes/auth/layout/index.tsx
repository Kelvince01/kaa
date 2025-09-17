import { useTranslations } from "next-intl";

export const AuthLayoutContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const t = useTranslations("auth.metadata");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">{children}</div>
    </div>
  );
};
