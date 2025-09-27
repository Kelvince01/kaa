import Image from "next/image";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import Separator from "@/components/common/separator";
import {
  Blockquote,
  H1,
  H2,
  H3,
  H4,
  Hyperlink,
  InlineCode,
  Li,
  OL,
  P,
  UL,
} from "@/components/common/typography";

type MDXComponentProps = {
  [key: string]: React.ReactNode | string | number | boolean | object;
  children?: React.ReactNode;
};

type ImageProps = {
  src?: string;
  alt?: string;
  [key: string]: React.ReactNode | string | number | boolean | object;
};

type LinkProps = {
  href?: string;
  [key: string]: React.ReactNode | string | number | boolean | object;
};

export default function MDXContent({
  mdxSource,
}: {
  mdxSource: MDXRemoteSerializeResult;
}) {
  return (
    <div className="mdx-content">
      <MDXRemote
        {...mdxSource}
        components={{
          h1: (props: MDXComponentProps) => <H1 {...props} />,
          h2: (props: MDXComponentProps) => <H2 {...props} />,
          h3: (props: MDXComponentProps) => <H3 {...props} />,
          h4: (props: MDXComponentProps) => <H4 {...props} />,
          p: (props: MDXComponentProps) => <P {...props} />,
          ul: (props: MDXComponentProps) => <UL {...props} />,
          ol: (props: MDXComponentProps) => <OL {...props} />,
          li: (props: MDXComponentProps) => <Li {...props} />,
          hr: () => <Separator className="my-8" />,
          a: (props: LinkProps) => <Hyperlink href={props.href} {...props} />,
          blockquote: (props: MDXComponentProps) => <Blockquote {...props} />,
          code: (props: MDXComponentProps) => <InlineCode {...props} />,
          img: (props: ImageProps) => (
            <Image
              alt={props.alt || ""}
              className="my-6 rounded-sm"
              height={600}
              src={props.src || ""}
              style={{
                maxWidth: "100%",
                height: "auto",
              }}
              width={1200}
            />
          ),
        }}
      />
    </div>
  );
}
