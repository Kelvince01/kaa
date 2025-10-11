import type { Metadata } from "next";
import dynamic from "next/dynamic";

const CreateCall = dynamic(
  () => import("@/routes/dashboard/calls/create-call"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Create Call | Dashboard",
  description: "Create a new video call or property tour",
};

export default function CreateCallPage() {
  return <CreateCall />;
}
