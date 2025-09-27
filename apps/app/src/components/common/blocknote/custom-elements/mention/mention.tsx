import {
  createReactInlineContentSpec,
  type DefaultReactGridSuggestionItem,
} from "@blocknote/react";
import { AvatarWrap } from "@/components/common/avatar-wrap";
import type { CustomBlockNoteSchema } from "@/components/common/blocknote/types";
import type { Member } from "@/modules/members/member.type";

// The Mention inline content.
export const MentionSchema = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      name: {
        default: "Unknown",
      },
      id: {
        default: "Unknown",
      },
    },
    content: "none",
  },
  {
    render: (props) => (
      <span
        style={{
          backgroundColor: "#E11D48",
          borderRadius: "2px",
          padding: "0px 2px",
        }}
      >
        @{props.inlineContent.props.name}
      </span>
    ),
  }
);

// Function which gets all users for the mentions menu.
export const getMentionMenuItems = (
  members: Member[],
  editor: CustomBlockNoteSchema
): DefaultReactGridSuggestionItem[] => {
  return members.map((m) => ({
    id: m.id,
    onItemClick: () => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            name: m.name,
            id: m.id,
          },
        },
        " ", // add a space after the mention
      ]);
    },
    icon: (
      <AvatarWrap
        className="h-5 w-5 text-xs"
        id={m.id}
        name={m.name}
        type="user"
        url={m.thumbnailUrl}
      />
    ),
  }));
};
