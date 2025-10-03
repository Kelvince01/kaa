import Image from "next/image";

export function Logo() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
      <Image alt="KAA" height={100} src="/logo/logo.svg" width={100} />
    </div>
  );
}
