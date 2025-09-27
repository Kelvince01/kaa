import type {
  BlockSchema,
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  InlineContentSchema,
  StyleSchema,
} from "@blocknote/core";
import {
  DragHandleMenu,
  type SideMenuProps,
  useComponentsContext,
} from "@blocknote/react";
import { GripVertical } from "lucide-react";

type CustomDragHandleButtonProps<
  BSchema extends BlockSchema = DefaultBlockSchema,
  I extends InlineContentSchema = DefaultInlineContentSchema,
  S extends StyleSchema = DefaultStyleSchema,
> = Omit<SideMenuProps<BSchema, I, S>, "addBlock"> & {
  hasDropdown?: boolean;
  position?: "left" | "right" | "top" | "bottom";
};

export const CustomDragHandleButton = <
  BSchema extends BlockSchema = DefaultBlockSchema,
  I extends InlineContentSchema = DefaultInlineContentSchema,
  S extends StyleSchema = DefaultStyleSchema,
>({
  hasDropdown = false,
  position = "top",
  dragHandleMenu: DragHandleContent = DragHandleMenu,
  blockDragStart,
  blockDragEnd,
  freezeMenu,
  unfreezeMenu,
  block,
}: CustomDragHandleButtonProps<BSchema, I, S>) => {
  // biome-ignore lint/style/noNonNullAssertion: req by author
  const Components = useComponentsContext()!;

  // Wrapper to match the signature of onDragStart
  const handleDragStart = ({ dataTransfer, clientY }: React.DragEvent) => {
    blockDragStart?.({ dataTransfer, clientY }, block);
  };

  // Prevent form submission when clicking the drag handle button
  const handleButtonClick = (e: React.MouseEvent) => e.preventDefault();

  // Common button properties
  const baseButtonProps = {
    onDragStart: handleDragStart,
    onDragEnd: blockDragEnd,
    className: "bn-button",
    icon: <GripVertical data-test="dragHandle" size={22} />,
  };

  return (
    <Components.Generic.Menu.Root
      onOpenChange={(open: boolean) => (open ? freezeMenu() : unfreezeMenu())}
      position={position}
    >
      {hasDropdown ? (
        <Components.Generic.Menu.Trigger>
          <Components.SideMenu.Button
            {...baseButtonProps}
            draggable
            label="Open side menu"
          />
        </Components.Generic.Menu.Trigger>
      ) : (
        <Components.SideMenu.Button
          {...baseButtonProps}
          draggable
          label="Drag button"
          onClick={handleButtonClick}
        />
      )}

      <DragHandleContent block={block} />
    </Components.Generic.Menu.Root>
  );
};
