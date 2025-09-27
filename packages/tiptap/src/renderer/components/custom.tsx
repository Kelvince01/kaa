import dynamic from "next/dynamic";
import Image from "next/image";
import type { ReactElement } from "react";
import type { Components } from "rehype-react";
import CopyButton from "./CopyButton";
import HeadingWithAnchor from "./HeadingWithAnchor";

const SyntaxHighlighter = dynamic(() => import("./SyntaxHighlighter"), {
  ssr: false,
});

const components: Partial<Components> = {
  h2: (props) => <HeadingWithAnchor level={2} {...props} />,
  h3: (props) => <HeadingWithAnchor level={3} {...props} />,
  h4: (props) => <HeadingWithAnchor level={4} {...props} />,
  img: ({ src, alt, width, ...props }: any) => (
    <Image
      alt={alt || ""}
      className="mx-auto rounded-lg"
      height={props["data-height"]}
      src={src}
      width={props["data-width"]}
    />
  ),
  iframe: ({ ...props }) => (
    <div>
      <iframe
        {...props}
        allowFullScreen={true}
        className="mx-auto aspect-video h-full w-full rounded-lg"
      />
    </div>
    //  <div className="relative pt-[56.25%] rounded-lg overflow-hidden">
    //    <div className="absolute inset-0">
    //      <iframe {...props} allowFullScreen={true} className="w-full h-full" />
    //    </div>
    //  </div>
  ),
  pre: ({ children, ...props }) => {
    const code = ((children as ReactElement).props as any).children;
    return (
      <div className="group not-prose relative overflow-hidden rounded-lg border border-[#d1d9e0] dark:border-[#3d444d]">
        <CopyButton code={String(code)} />
        <pre {...(props as any)}>{children}</pre>
      </div>
    );
  },
  code: ({ children, ...props }) => {
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const match = /language-(\w+)/.exec(props.className || "");
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const code = String(children).replace(/\n$/, "");
    return match ? (
      <SyntaxHighlighter content={code} language={match[1]} />
    ) : (
      <code {...props}>{children}</code>
    );
  },
  table: (props: any) => (
    <table
      className="not-prose mx-auto w-full table-auto border-collapse text-sm"
      {...props}
    />
  ),
  tr: (props: any) => (
    <tr
      className="border-b border-b-[#d1d9e0] last:border-b-0 dark:border-b-[#3d444d]"
      {...props}
    />
  ),
  td: (props: any) => <td className="px-2.5 py-3.5" {...props} />,
  th: (props: any) => <td className="px-2.5 py-3.5 font-bold" {...props} />,
};
export default components;
