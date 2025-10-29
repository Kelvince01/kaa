import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export default function DocumentsLayout({ children }: LayoutProps) {
  return <div className="space-y-6">{children}</div>;
}
