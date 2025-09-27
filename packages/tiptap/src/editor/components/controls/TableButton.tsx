import { useEditorState } from "@tiptap/react";
import TableBuilder from "../../components/TableBuilder";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const TableButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (_ctx) => {
      return {
        // disabled: !ctx.editor.can().insertTable(),
      };
    },
  });

  return (
    <MenuButton
      hideArrow
      icon="Table"
      tooltip="Table"
      type="popover"
      {...state}
    >
      <TableBuilder
        onCreate={({ rows, cols }) =>
          editor
            .chain()
            .insertTable({ rows, cols, withHeaderRow: false })
            .focus()
            .run()
        }
      />
    </MenuButton>
  );
};

export default TableButton;
