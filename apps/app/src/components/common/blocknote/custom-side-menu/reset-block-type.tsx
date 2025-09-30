import type {
  Block,
  BlockConfig,
  InlineContentSchema,
  StyleSchema,
} from "@blocknote/core";
import {
  type BlockTypeSelectItem,
  type DragHandleMenuProps,
  useComponentsContext,
  useDictionary,
} from "@blocknote/react";
import { useMemo } from "react";
import {
  customBlockTypeSelectItems,
  getSideMenuItems,
} from "@/components/common/blocknote/blocknote-config";
import { focusEditor } from "@/components/common/blocknote/helpers";
import type {
  BasicBlockTypes,
  CustomBlockNoteSchema,
  KaaCustomBlockTypes,
} from "@/components/common/blocknote/types";

type ResetBlockTypeItemProp = {
  editor: CustomBlockNoteSchema;
  props: DragHandleMenuProps;
  allowedTypes: (KaaCustomBlockTypes | BasicBlockTypes)[];
};
export function ResetBlockTypeItem({
  editor,
  props: { block },
  allowedTypes,
}: ResetBlockTypeItemProp) {
  // biome-ignore lint/style/noNonNullAssertion: required by author
  const Components = useComponentsContext()!;
  const dict = useDictionary();

  const filteredSelectItems = customBlockTypeSelectItems.filter((i) =>
    allowedTypes.includes(i)
  );

  const filteredItems = useMemo(
    () =>
      getSideMenuItems(dict).filter((item) =>
        filteredSelectItems.includes(
          item.type as BasicBlockTypes | KaaCustomBlockTypes
        )
      ),
    [dict, filteredSelectItems]
  );

  // Determine if the current block type should be shown
  const shouldShow = useMemo(
    () => filteredItems.some((item) => item.type === block.type),
    [block.type, filteredItems]
  );

  // Handle item click for updating the block type
  const handleItemClick = (
    item: BlockTypeSelectItem & { oneInstanceOnly?: boolean }
  ) => {
    if (item.oneInstanceOnly) {
      const existingBlock = editor.document.find(
        (block) => block.type === item.type
      );
      if (existingBlock)
        editor.updateBlock(existingBlock, { type: "paragraph" });
    }

    // Update the selected block
    editor.updateBlock(block, {
      type: item.type as
        | Exclude<BasicBlockTypes, "emoji">
        | KaaCustomBlockTypes,
      props: item.props as any, // Pass props (to get heading level: 1 | 2 | 3)
    });
    // to reset editor focus so side menu open state does not block the on blur update
    setTimeout(() => focusEditor(editor, block.id), 0);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: required by author
  const fullItems = useMemo(
    () =>
      filteredItems.map((item) => {
        const { type, icon: Icon, isSelected, name } = item;
        return {
          type,
          title: name,
          icon: <Icon size={16} />,
          onClick: () => handleItemClick(item),
          isSelected: isSelected(
            block as unknown as Block<
              Record<string, BlockConfig>,
              InlineContentSchema,
              StyleSchema
            >
          ),
        };
      }),
    [block, filteredItems, editor]
  );
  // If block type should not be shown or the editor is not editable, return null early
  if (!(shouldShow && editor.isEditable)) return null;

  return (
    <>
      {fullItems.map(({ title, type, icon, onClick }) => {
        const isSelected =
          block.type === "heading"
            ? title.includes(block.props.level.toString())
            : block.type === type;
        return (
          <Components.Generic.Menu.Item
            checked={isSelected}
            className="bn-menu-item"
            icon={icon}
            key={title}
            onClick={onClick}
          >
            {title}
          </Components.Generic.Menu.Item>
        );
      })}
    </>
  );
}
