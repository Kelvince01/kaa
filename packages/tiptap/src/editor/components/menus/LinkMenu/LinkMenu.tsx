import { useEditorState } from "@tiptap/react";
import { memo, useCallback, useRef, useState } from "react";
import { BubbleMenu } from "../../BubbleMenu";
import { useTiptapContext } from "../../Provider";
import LinkEdit from "./LinkEdit";
import LinkView from "./LinkView";

export const LinkMenu = () => {
  const { editor, contentElement } = useTiptapContext();
  const [isEditing, setIsEditing] = useState(false);
  const mode = useRef<number>(0);

  const link = useEditorState({
    editor,
    selector: (context) => {
      mode.current = (context.editor.storage as any).link.mode;

      if (!context.editor.isActive("link")) return null;
      const {
        state: { selection, doc },
      } = context.editor;
      const url = context.editor.getAttributes("link").href;
      const text = doc.textBetween(selection.from, selection.to);

      return { url, text };
    },
  });

  const shouldShow = useCallback(({ editor, from, to }: any) => {
    setIsEditing(mode.current === -1);
    return editor.isActive("link") && (mode.current === -1 || from !== to);
  }, []);

  const applyLink = useCallback(
    (url: string, text?: string) => {
      editor
        .chain()
        // @ts-expect-error
        .confirmEditLink({
          href: url,
          text: text || url,
        })
        .run();
      setIsEditing(false);
    },
    [editor]
  );

  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  const startEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    if (mode.current === -1) {
      // @ts-expect-error
      editor.commands.confirmEditLink();
    } else {
      setIsEditing(false);
    }
  }, [editor.commands]);

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="link-menu"
      shouldShow={shouldShow}
      // TODO: fix tippy
      // tippyOptions={{
      //   placement: "bottom-start",
      //   duration: 100,
      //   appendTo: () => contentElement.current!,
      //   onHidden: () => setIsEditing(false),
      // }}
      updateDelay={100}
    >
      {isEditing ? (
        <LinkEdit
          initialText={link?.text}
          initialUrl={link?.url}
          isCreate={mode.current === -1}
          onApply={applyLink}
          onCancel={cancelEdit}
        />
      ) : (
        <LinkView onEdit={startEdit} onRemove={removeLink} url={link?.url} />
      )}
    </BubbleMenu>
  );
};

export default memo(LinkMenu);
