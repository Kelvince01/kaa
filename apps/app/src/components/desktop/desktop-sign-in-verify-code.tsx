"use client";

import Image from "next/image";
import appIcon from "public/appicon.png";
import { useEffect, useRef } from "react";

type DesktopSignInVerifyCodeProps = {
  code: string;
};

export function DesktopSignInVerifyCode({
  code,
}: DesktopSignInVerifyCodeProps) {
  const hasRunned = useRef(false);

  useEffect(() => {
    if (code && !hasRunned.current) {
      window.location.replace(`kaa://api/auth/callback?code=${code}`);
      hasRunned.current = true;
    }
  }, [code]);

  return (
    <div>
      <div className="flex h-screen flex-col items-center justify-center text-center text-[#606060] text-sm">
        <Image
          alt="Kaa"
          className="mb-10"
          height={80}
          quality={100}
          src={appIcon}
          width={80}
        />
        <p>Signing in...</p>
        <p className="mb-4">
          If Kaa dosen't open in a few seconds,{" "}
          <a
            className="underline"
            href={`kaa://api/auth/callback?code=${code}`}
          >
            click here
          </a>
          .
        </p>
        <p>You may close this browser tab when done</p>
      </div>
    </div>
  );
}
