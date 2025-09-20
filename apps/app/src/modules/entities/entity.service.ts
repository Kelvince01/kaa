import type { Entity } from "@kaa/config";
import { httpClient } from "@/lib/axios";

// Check if slug is available
export const checkSlugAvailable = async ({
  slug,
  type,
}: {
  slug: string;
  type: Entity;
}) => {
  const response = await httpClient.api.get(`/entities/check-slug/${slug}`, {
    params: {
      type,
    },
  });

  return response.data;
};
