import "server-only";

import { headers } from "next/headers";

export async function getGeolocation() {
	const ipCountry = (await headers()).get("x-vercel-ip-country") as string | null;
	const ip = (await headers()).get("x-forwarded-for") as string | null;

	return { ipCountry, ip: ip?.split(",")[0] };
}
