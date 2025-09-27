import type { MetadataRoute } from "next";

const baseUrl = "https://kaapro.dev";

const baseRoutes = [
  {
    url: `${baseUrl}/`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 1,
  },
  {
    url: `${baseUrl}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${baseUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  },
];

const changelogRoutes = [
  {
    url: `${baseUrl}/changelog`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  },
];

const routes = [...baseRoutes, ...changelogRoutes];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes;
}
