"use client";

import { createElement, Fragment, useEffect, useState } from "react";
import components from "./components/custom";
import { createProcessor } from "./utils/processor";

type TiptapRendererProps = {
  children: string;
};

const TiptapRenderer = ({ children }: TiptapRendererProps) => {
  const [Content, setContent] = useState(createElement(Fragment));

  useEffect(() => {
    (async () => {
      const processor = createProcessor({ components });
      const output = await processor.process(children);

      setContent(output.result as any);
    })();
  }, [children]);

  return Content;
};

export default TiptapRenderer;
