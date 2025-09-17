"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import useMounted from "@/hooks/use-mounted";
// import BgAnimation from "../bg-animation";
import { useAuthStore } from "@/modules/auth/auth.store";

export default function AccountLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const params = useSearchParams();
  const redirect = params.get("redirectTo");
  const { hasStarted, hasWaited } = useMounted();

  useEffect(() => {
    // If already authenticated, redirect
    if (user) {
      router.push(redirect ? redirect : "/dashboard");
    }
  }, [user, router, redirect]);

  return (
    <div
      className="flex min-h-screen flex-col justify-center bg-gray-50"
      data-started={hasStarted}
      data-waited={hasWaited}
    >
      {/* Render bg animation */}
      {/* <div className="fixed top-0 left-0 h-full w-full transition-opacity delay-1000 duration-1000 group-data-[waited=false]:opacity-0 group-data-[waited=true]:opacity-100">
				<BgAnimation />
			</div> */}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mt-4 flex justify-center">
          <Link href="/">
            <div className="relative h-12 w-auto cursor-pointer">
              <Image
                alt="Kaa"
                height={48}
                priority
                src="/logo.svg"
                width={48}
              />
            </div>
          </Link>
        </div>
      </div>
      {children}
      <div className="mt-4 mb-4 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Kaa. All rights reserved.</p>
      </div>
    </div>
  );
}
