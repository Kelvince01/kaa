import type { IconType } from ".";

const IconInlineCode: IconType = ({ size = 24, ...props }) => {
  return (
    <svg
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 0h24v24H0z" fill="none" stroke="none" />
      <path d="M8 6.5l-5.5 5.5l5.5 5.5" />
      <path d="M16 6.5l5.5 5.5l-5.5 5.5" />
    </svg>
  );
};

export default IconInlineCode;
