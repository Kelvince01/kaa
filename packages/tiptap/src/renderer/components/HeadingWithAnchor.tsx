import Link from "next/link";
import type { JSX, ReactNode } from "react";

type HeadingWithAnchorProps = {
  level: number;
  id?: string;
  children?: ReactNode;
};

const HeadingWithAnchor = ({ level, children, id }: HeadingWithAnchorProps) => {
  const Heading = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Heading id={id}>
      <Link
        className="not-prose group hover:before:-left-6 hover:before:-translate-y-1/2 relative font-inherit hover:before:absolute hover:before:top-1/2 hover:before:text-[1em] hover:before:opacity-70 hover:before:content-['#']"
        href={`#${id}`}
      >
        {children}
      </Link>
    </Heading>
  );
};

export default HeadingWithAnchor;
