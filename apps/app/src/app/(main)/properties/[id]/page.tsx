import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import getQueryClient from "@/app/getQueryClient";
import { getProperty } from "@/modules/properties";

// Dynamic imports to handle client components
const PropertyDetailsContainer = dynamic(
  () => import("@/routes/main/properties/detail"),
  {
    ssr: true,
  }
);

type Props = {
  params: Promise<{ id: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const queryClient = getQueryClient();
    const { id } = await params;

    const property = await queryClient.fetchQuery({
      queryKey: ["property", id],
      queryFn: () => getProperty(id),
    });

    if (!property) {
      return {
        title: "Property Not Found | Kaa",
        description: "The property you're looking for could not be found.",
      };
    }
    return {
      title: `${property.title} | Kaa`,
      description:
        property.description?.substring(0, 160) ||
        "View details for this property",
      openGraph: {
        title: property.title,
        description:
          property.description?.substring(0, 160) ||
          "View details for this property",
        images: property.media.images?.[0]?.url
          ? [property.media.images[0].url]
          : [],
        type: "article",
      },
    };
  } catch {
    return {
      title: "Property Not Found | Kaa",
      description: "The property you're looking for could not be found.",
    };
  }
}

export default async function PropertyDetailsPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <PropertyDetailsContainer propertyId={id} searchParams={searchParams} />
  );
}
