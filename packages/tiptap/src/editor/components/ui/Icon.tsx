import clsx from "clsx";
import { type IconBaseProps, icons } from "../icons/icons";

export type IconProps = IconBaseProps & {
  name: keyof typeof icons;
};

export const Icon = ({ name, className, size = 20, ...props }: IconProps) => {
  const Comp = icons[name];

  return (
    <Comp className={clsx("rte-icon", className)} size={size} {...props} />
  );
};

export default Icon;
