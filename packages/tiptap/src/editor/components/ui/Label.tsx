import clsx from "clsx";
import type React from "react";
import type { JSX, ReactNode } from "react";

type LabelProps = {
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
  children: ReactNode;
  className?: string;
};

const Label = ({
  as: Comp = "label",
  children,
  className = "",
}: LabelProps) => (
  <Comp className={clsx("rte-label", className)}>{children}</Comp>
);

export default Label;
