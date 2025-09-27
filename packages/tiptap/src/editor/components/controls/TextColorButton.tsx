import { useEditorState } from "@tiptap/react";
import type React from "react";
import { type CSSProperties, useRef } from "react";
import { createPortal } from "react-dom";
import useMount from "../../hooks/useMount";
import ColorPicker from "../color-picker";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const TextColorButton: React.FC = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mounted = useMount();
  const { editor } = useTiptapContext();

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      color: ctx.editor.getAttributes("textStyle").color || "DEFAULT",
      disabled: !ctx.editor.can().setColor(""),
    }),
  });

  const colorBarStyle = {
    position: "absolute",
    bottom: 1.5,
    insetInline: 4,
    height: 4,
    borderRadius: 4,
    pointerEvents: "none",
    background:
      state.color === "DEFAULT" ? "var(--rte-fg, black)" : state.color,
  };

  const renderBar =
    mounted && buttonRef.current
      ? createPortal(
          <div style={colorBarStyle as CSSProperties} />,
          buttonRef.current
        )
      : null;

  return (
    <>
      <MenuButton
        disabled={state.disabled}
        hideArrow
        icon="TextColor"
        ref={buttonRef}
        tooltip="Color"
        type="popover"
      >
        <ColorPicker
          color={state.color}
          onChange={(color) => editor.chain().focus().setColor(color).run()}
          onReset={() => editor.chain().focus().unsetColor().run()}
        />
      </MenuButton>
      {renderBar}
    </>
  );
};

export default TextColorButton;
