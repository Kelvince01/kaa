import { useCallback } from "react";
import { getNodeContainer } from "../../utils/getNodeContainer";
import { BubbleMenu } from "../BubbleMenu";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";
import { Toolbar } from "../ui/Toolbar";

const TableMenu = () => {
  const { editor, contentElement } = useTiptapContext();

  const shouldShow = useCallback(({ editor }: any) => {
    return editor.isActive("table");
  }, []);

  const getReferenceClientRect = useCallback(() => {
    const node = getNodeContainer(editor, "table");
    return node?.getBoundingClientRect() || new DOMRect(-1000, -1000, 0, 0);
  }, [editor]);

  const addRowOrColumn = useCallback(
    (type: "Row" | "Column", position: "Before" | "After") => {
      const command = `add${type}${position}` as const;
      return () => editor.chain().focus()[command]().run();
    },
    [editor]
  );

  const deleteRowOrColumn = useCallback(
    (type: "Row" | "Column") => {
      const command = `delete${type}` as const;
      return () => editor.chain().focus()[command]().run();
    },
    [editor]
  );

  const toggleHeader = useCallback(
    (type: "Row" | "Column") => {
      const command = `toggleHeader${type}` as const;
      return () => editor.chain().focus()[command]().run();
    },
    [editor]
  );

  const mergeCells = useCallback(
    () => editor.chain().focus().mergeCells().run(),
    [editor]
  );
  const splitCell = useCallback(
    () => editor.chain().focus().splitCell().run(),
    [editor]
  );
  const deleteTable = useCallback(
    () => editor.chain().focus().deleteTable().run(),
    [editor]
  );

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={"table-bubble"}
      shouldShow={shouldShow}
      // TODO: fix tippy
      // tippyOptions={{
      //   placement: "top",
      //   maxWidth: "auto",
      //   appendTo: () => contentElement.current!,
      //   getReferenceClientRect,
      // }}
      updateDelay={100}
    >
      <Toolbar>
        <MenuButton
          icon="RowInsertTop"
          onClick={addRowOrColumn("Row", "Before")}
          tooltip="Add row above"
        />
        <MenuButton
          icon="RowInsertBottom"
          onClick={addRowOrColumn("Row", "After")}
          tooltip="Add row below"
        />
        <MenuButton
          icon="ColInsertLeft"
          onClick={addRowOrColumn("Column", "Before")}
          tooltip="Add column before"
        />
        <MenuButton
          icon="ColInsertRight"
          onClick={addRowOrColumn("Column", "After")}
          tooltip="Add column after"
        />
        <MenuButton icon="SplitCell" onClick={splitCell} tooltip="Split cell" />
        <MenuButton
          icon="MergeCell"
          onClick={mergeCells}
          tooltip="Merge cells"
        />
      </Toolbar>
      <Toolbar style={{ justifyContent: "center" }}>
        <MenuButton
          icon="RowHeader"
          onClick={toggleHeader("Row")}
          tooltip="Toggle row header"
        />
        <MenuButton
          icon="ColHeader"
          onClick={toggleHeader("Column")}
          tooltip="Toggle column header"
        />
        <MenuButton
          icon="RowRemove"
          onClick={deleteRowOrColumn("Row")}
          tooltip="Delete row"
        />
        <MenuButton
          icon="ColRemove"
          onClick={deleteRowOrColumn("Column")}
          tooltip="Delete column"
        />
        <MenuButton icon="Trash" onClick={deleteTable} tooltip="Delete table" />
      </Toolbar>
    </BubbleMenu>
  );
};

export default TableMenu;
