import type React from "react";
import { useState } from "react";
import MenuButton from "../../MenuButton";
import Input from "../../ui/Input";

type AltTextEditProps = {
  initialText?: string;
  onCancel: () => void;
  onApply: (value: string) => void;
};

const AltTextEdit = ({ initialText, onApply, onCancel }: AltTextEditProps) => {
  const [text, setText] = useState(initialText || "");

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onApply(text);
  };

  return (
    <form className="rte-text-alternative__form" onSubmit={onSubmit}>
      <Input
        autoFocus
        onChange={(e) => setText(e.target.value)}
        placeholder="Text alternative"
        value={text}
      />
      <MenuButton buttonType="submit" icon={"Check"} tooltip={false} />
      <MenuButton icon={"Close"} onClick={onCancel} tooltip={false} />
    </form>
  );
};

export default AltTextEdit;
