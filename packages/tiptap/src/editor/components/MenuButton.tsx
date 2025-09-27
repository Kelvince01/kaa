import clsx from "clsx";
import React, { type CSSProperties, memo, useMemo } from "react";
import { getShortcutKey } from "../utils/shortcut";
import { useTiptapContext } from "./Provider";
import Button, { type ButtonProps } from "./ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import Icon, { type IconProps } from "./ui/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import Tooltip from "./ui/Tooltip";

interface MenuButtonProps
  extends Omit<ButtonProps, "variant" | "ref" | "type"> {
  icon?: IconProps["name"];
  type?: "button" | "dropdown" | "popover";
  buttonType?: ButtonProps["type"];
  text?: string;
  active?: boolean;
  shortcuts?: string[];
  hideText?: boolean;
  hideArrow?: boolean;
  tooltip?: string | boolean;
  buttonClass?: string;
  buttonStyle?: CSSProperties;
  dropdownClass?: string;
  dropdownStyle?: CSSProperties;
}

const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  (
    {
      active,
      icon,
      text,
      shortcuts,
      className,
      children,
      type,
      buttonType,
      hideText = true,
      hideArrow = false,
      tooltip = true,
      buttonClass,
      buttonStyle,
      dropdownClass,
      dropdownStyle,
      disabled,
      ...props
    },
    ref
  ) => {
    const { editor, contentElement } = useTiptapContext();

    const hasArrowIcon =
      type === "dropdown" || (type === "popover" && !hideArrow);
    const hasIconOnly = hideText && !hasArrowIcon;

    const tooltipContent = useMemo(() => {
      if (tooltip === false) return null;
      const content = {
        title: typeof tooltip === "string" ? tooltip : text,
        shortcuts: shortcuts
          ? `(${shortcuts.map(getShortcutKey).join(" + ")})`
          : "",
      };

      return `${content.title} ${content.shortcuts}`;
    }, [tooltip, text, shortcuts]);

    const renderIcon = useMemo(
      () => (icon ? <Icon className="rte-button-icon" name={icon} /> : null),
      [icon]
    );

    const renderButton = (
      <Button
        aria-label={typeof tooltip === "string" ? tooltip : text}
        className={clsx("rte-menu__button", buttonClass)}
        data-active={(editor.isEditable && active) || undefined}
        disabled={!editor.isEditable || disabled}
        iconOnly={hasIconOnly}
        onFocusCapture={(e) => e.stopPropagation()}
        ref={ref}
        slotAfter={
          hasArrowIcon && (
            <span className="rte-icon-arrow">
              <Icon name="ChevronDown" size={16} />
            </span>
          )
        }
        slotBefore={!hasIconOnly && renderIcon}
        style={buttonStyle}
        type={buttonType}
        variant="ghost"
        {...props}
      >
        {hasIconOnly ? renderIcon : !hideText && text}
      </Button>
    );

    const renderContent = tooltipContent ? (
      <Tooltip
        content={tooltipContent}
        options={{ collisionBoundary: contentElement.current?.parentElement }}
      >
        {renderButton}
      </Tooltip>
    ) : (
      renderButton
    );

    if (type === "dropdown") {
      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>{renderContent}</DropdownMenuTrigger>
          <DropdownMenuContent
            className={dropdownClass}
            onCloseAutoFocus={(e) => e.preventDefault()}
            style={dropdownStyle}
          >
            {children}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (type === "popover") {
      return (
        <Popover modal={false}>
          <PopoverTrigger asChild>{renderContent}</PopoverTrigger>
          <PopoverContent
            className={dropdownClass}
            onCloseAutoFocus={(e) => e.preventDefault()}
            style={dropdownStyle}
          >
            {children}
          </PopoverContent>
        </Popover>
      );
    }

    return renderContent;
  }
);

MenuButton.displayName = "MenuButton";

export default memo(MenuButton);
