import clsx from "clsx";
import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      className={clsx("rte-input", className)}
      ref={ref}
      type={type}
      {...props}
    />
  )
);
Input.displayName = "Input";

export default Input;
