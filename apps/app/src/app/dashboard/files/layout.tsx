import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Files | Dashboard",
  description: "Manage your uploaded files and documents",
};

export default function FilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
