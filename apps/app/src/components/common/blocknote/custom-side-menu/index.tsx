import { DragHandleMenu, SideMenu, SideMenuController } from "@blocknote/react";
import { sideMenuOpenOnTypes } from "@/components/common/blocknote/blocknote-config";
import { CustomDragHandleButton } from "@/components/common/blocknote/custom-side-menu/drag-handle-button";
import { ResetBlockTypeItem } from "@/components/common/blocknote/custom-side-menu/reset-block-type";
import type {
  BasicBlockTypes,
  CustomBlockNoteSchema,
  KaaCustomBlockTypes,
} from "@/components/common/blocknote/types";

// in this menu we have only drag button
export const CustomSideMenu = ({
  editor,
  allowedTypes,
}: {
  editor: CustomBlockNoteSchema;
  allowedTypes: (KaaCustomBlockTypes | BasicBlockTypes)[];
}) => (
  <SideMenuController
    sideMenu={(props) => (
      <SideMenu {...props}>
        <CustomDragHandleButton
          dragHandleMenu={(props) => (
            <>
              {sideMenuOpenOnTypes.includes(
                props.block.type as BasicBlockTypes | KaaCustomBlockTypes
              ) ? (
                <DragHandleMenu {...props}>
                  <ResetBlockTypeItem
                    allowedTypes={allowedTypes}
                    editor={editor}
                    props={props}
                  />
                </DragHandleMenu>
              ) : null}
            </>
          )}
          hasDropdown={sideMenuOpenOnTypes.includes(
            props.block.type as BasicBlockTypes | KaaCustomBlockTypes
          )}
          {...props}
        />
      </SideMenu>
    )}
  />
);
