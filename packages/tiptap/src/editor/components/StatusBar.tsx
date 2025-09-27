import { useEditorState } from "@tiptap/react";
import { memo } from "react";
import MenuButton from "./MenuButton";
import { useTiptapContext } from "./Provider";
import { Toolbar } from "./ui/Toolbar";

const StatusBar = () => {
  const {
    editor,
    isFullScreen,
    isSourceMode,
    toggleFullScreen,
    toggleSourceMode,
  } = useTiptapContext();
  const counter = useEditorState({
    editor,
    selector: (ctx) => ({
      words: ctx.editor.storage.characterCount.words(),
      characters: ctx.editor.storage.characterCount.characters(),
    }),
  });

  return (
    <div className="rte-status-bar">
      <Toolbar dense>
        <MenuButton
          active={isSourceMode}
          icon="SourceCode"
          onClick={toggleSourceMode}
          text="Source Code"
        />
        <MenuButton
          active={isFullScreen}
          icon={isFullScreen ? "Minimize" : "Maximize"}
          onClick={toggleFullScreen}
          text="Fullscreen"
        />
      </Toolbar>

      <div className="rte-counter">
        <span className="rte-word-count">Words: {counter.words}</span>
        <span className="rte-charater">Characters: {counter.characters}</span>
      </div>
    </div>
  );
};

export default memo(StatusBar);
