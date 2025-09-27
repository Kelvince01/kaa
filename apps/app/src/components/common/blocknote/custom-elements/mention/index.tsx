import { GridSuggestionMenuController } from "@blocknote/react";
import { getMentionMenuItems } from "@/components/common/blocknote/custom-elements/mention/mention";
import type { CustomBlockNoteSchema } from "@/components/common/blocknote/types";
import type { Member } from "@/modules/members/member.type";

export const Mention = ({
  members,
  editor,
}: {
  members?: Member[];
  editor: CustomBlockNoteSchema;
}) => {
  if (!members || members.length === 0) return;
  return (
    <GridSuggestionMenuController
      columns={2}
      getItems={async () =>
        getMentionMenuItems(members, editor).map((item) => ({
          ...item,
          title: item.id,
        }))
      }
      minQueryLength={0}
      triggerCharacter={"@"}
    />
  );
};
