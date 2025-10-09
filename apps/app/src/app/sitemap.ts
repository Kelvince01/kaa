import type { MetadataRoute } from "next";

const baseUrl = "https://kaapro.dev";

const baseRoutes: MetadataRoute.Sitemap = [
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
  {
    url: `${baseUrl}/properties`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 1,
  },
  {
    url: `${baseUrl}/for-landlords`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    url: `${baseUrl}/for-tenants`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    url: `${baseUrl}/how-it-works`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    url: `${baseUrl}/privacy-policy`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${baseUrl}/terms-of-service`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${baseUrl}/cookie-policy`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
];

const changelogRoutes: MetadataRoute.Sitemap = [
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
