import { filterSuggestionItems } from "@blocknote/core";
import { SuggestionMenuController } from "@blocknote/react";

import { getSlashMenuItems } from "@/components/common/blocknote/blocknote-config";
import { slashMenu } from "@/components/common/blocknote/custom-slash-menu/custom-slash-menu";
import { getSortedSlashMenuItems } from "@/components/common/blocknote/helpers";
import type {
  BasicBlockTypes,
  CustomBlockNoteSchema,
  KaaCustomBlockTypes,
} from "@/components/common/blocknote/types";

export const CustomSlashMenu = ({
  editor,
  allowedTypes,
}: {
  editor: CustomBlockNoteSchema;
  allowedTypes: (KaaCustomBlockTypes | BasicBlockTypes)[];
}) => {
  const { items, indexedItemCount, originalItemCount } =
    getSortedSlashMenuItems(getSlashMenuItems(editor), allowedTypes);

  return (
    <SuggestionMenuController
      getItems={async (query) => filterSuggestionItems(items, query)}
      suggestionMenuComponent={(props) =>
        slashMenu(props, editor, indexedItemCount, originalItemCount)
      }
      triggerCharacter={"/"}
    />
  );
};
