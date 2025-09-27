import type React from "react";
import { useEffect, useState } from "react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Label from "../../ui/Label";

type LinkEditProps = {
  initialUrl?: string;
  initialText?: string;
  isCreate?: boolean;
  onCancel: () => void;
  onApply: (url: string, text?: string) => void;
};

const LinkEdit = ({
  initialUrl,
  initialText,
  isCreate,
  onApply,
  onCancel,
}: LinkEditProps) => {
  const [url, setUrl] = useState(initialUrl || "");
  const [text, setText] = useState(initialText || "");
  const [canSubmit, setCanSubmit] = useState(isCreate);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (canSubmit) {
      // biome-ignore lint/style/noNonNullAssertion: ignore
      onApply(url!, text);
    }
  };

  useEffect(() => {
    if (!isCreate) {
      setCanSubmit((url && url !== initialUrl) || text !== initialText);
    }
  }, [text, url, initialText, initialUrl, isCreate]);

  return (
    <form className="rte-link__form" onSubmit={onSubmit}>
      <Label className="rte-link__label">URL</Label>
      <Input
        autoFocus
        className="rte-link__input"
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste link"
        required
        type="url"
        value={url}
      />

      <Label className="rte-link__label">Display Text</Label>
      <Input
        className="rte-link__input"
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter link text"
        value={text}
      />

      <div className="rte-link__actions">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button disabled={!canSubmit} type="submit">
          Apply
        </Button>
      </div>
    </form>
  );
};

export default LinkEdit;
