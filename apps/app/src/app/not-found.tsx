import { Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="font-bold text-9xl text-primary-600">404</h1>
        <h2 className="mt-4 font-bold text-3xl text-gray-900">
          Page not found
        </h2>
        <p className="mt-6 text-base text-gray-600">
          Sorry, we couldn't find the page you're looking for. It might have
          been moved or deleted.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center rounded-md bg-primary/80 px-5 py-3 font-medium text-base text-white transition-colors hover:bg-primary-700"
            href="/"
          >
            <Home className="mr-2" />
            Go back home
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-3 font-medium text-base text-gray-700 transition-colors hover:bg-gray-50"
            href="/properties"
          >
            <Search className="mr-2" />
            Search properties
          </Link>
        </div>
      </div>
    </div>
  );
}
