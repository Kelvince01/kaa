import { Button, type ButtonProps } from "@kaa/ui/components/button";
import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { toast } from "sonner";
import { TooltipButton } from "@/components/common/tooltip-button";
import { useOnlineManager } from "@/hooks/use-online-manager";

const SubmitButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "type">
>(({ onClick, children, ...props }, ref) => {
  const { isOnline } = useOnlineManager();
  const t = useTranslations();

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!isOnline) {
      e.preventDefault();
      return toast(t("common.action.offline.text"), {
        icon: <TriangleAlert className="mr-2" size={16} />,
      });
    }
    onClick?.(e);
  };

  const buttonContent = (
    <Button onClick={handleClick} ref={ref} type="submit" {...props}>
      {!isOnline && <TriangleAlert className="mr-2" size={16} />}
      {children}
    </Button>
  );

  return (
    <>
      {isOnline ? (
        buttonContent
      ) : (
        <TooltipButton toolTipContent={t("common.offline.text_with_info")}>
          {buttonContent}
        </TooltipButton>
      )}
    </>
  );
});

export { SubmitButton };
