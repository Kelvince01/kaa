import type { Metadata } from "next";
import dynamic from "next/dynamic";

const AboutContainer = dynamic(() => import("@/routes/main/about"), {
  ssr: true,
});

export const metadata: Metadata = {
  title: "About | Kaa",
  description: "About Kaa",
};

export default function AboutPage() {
  return <AboutContainer />;
}
