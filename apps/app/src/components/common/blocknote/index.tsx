import type { Block } from "@blocknote/core";
import {
  FilePanelController,
  type FilePanelProps,
  GridSuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import * as Badge from "@kaa/ui/components/badge";
import * as Button from "@kaa/ui/components/button";
import * as Card from "@kaa/ui/components/card";
import * as DropdownMenu from "@kaa/ui/components/dropdown-menu";
import * as Input from "@kaa/ui/components/input";
import * as Label from "@kaa/ui/components/label";
import * as Popover from "@kaa/ui/components/popover";
import * as Select from "@kaa/ui/components/select";
import * as Tabs from "@kaa/ui/components/tabs";
import * as Toggle from "@kaa/ui/components/toggle";
import * as Tooltip from "@kaa/ui/components/tooltip";
import { usePathname } from "next/navigation";
import {
  type KeyboardEventHandler,
  type MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  allowedFileTypes,
  allowedTypes,
  customSchema,
  customSlashIndexedItems,
  customSlashNotIndexedItems,
} from "@/components/common/blocknote/blocknote-config";
import { Mention } from "@/components/common/blocknote/custom-elements/mention";
import { CustomFormattingToolbar } from "@/components/common/blocknote/custom-formatting-toolbar";
import { CustomSideMenu } from "@/components/common/blocknote/custom-side-menu";
import { CustomSlashMenu } from "@/components/common/blocknote/custom-slash-menu";
import {
  compareIsContentSame,
  focusEditor,
  getContentAsString,
  getUrlFromProps,
  handleSubmitOnEnter,
} from "@/components/common/blocknote/helpers";
import type {
  BasicBlockBaseTypes,
  BasicFileBlockTypes,
  KaaCustomBlockTypes,
} from "@/components/common/blocknote/types";
import { useBreakpoints } from "@/hooks/use-breakpoints";
import {
  type CarouselAttachment,
  openAttachmentDialog,
} from "@/modules/files/upload/helpers";
import type { Member } from "@/modules/members/member.type";
import { useUIStore } from "@/shared/stores/ui.store";

import "@/components/common/blocknote/app-specific-custom/styles.css";
import "@/components/common/blocknote/styles.css";

type BlockNoteProps = {
  id: string;
  defaultValue?: string;
  className?: string;
  sideMenu?: boolean;
  slashMenu?: boolean;
  formattingToolbar?: boolean;
  updateDataOnBeforeLoad?: boolean;
  trailingBlock?: boolean;
  altClickOpensPreview?: boolean;
  emojis?: boolean;
  allowedBlockTypes?: (BasicBlockBaseTypes | KaaCustomBlockTypes)[];
  members?: Member[];
  updateData: (html: string) => void;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onEscapeClick?: () => void;
  onEnterClick?: () => void;
  onTextDifference?: () => void;
} & (
  | {
      // filePanel and allowedFileBlockTypes req to add together
      filePanel: (props: FilePanelProps) => React.ReactElement;
      allowedFileBlockTypes?: BasicFileBlockTypes[];
    }
  | {
      // if neither is provided, it allows the omission of both
      filePanel?: never;
      allowedFileBlockTypes?: never;
    }
);

export const BlockNote = ({
  id,
  defaultValue = "",
  className = "",
  sideMenu = true,
  slashMenu = true,
  formattingToolbar = true,
  emojis = true,
  trailingBlock = true,
  updateDataOnBeforeLoad = false,
  altClickOpensPreview = false,
  // allow default types
  allowedBlockTypes = allowedTypes,
  members,
  filePanel,
  // allow default filetypes
  allowedFileBlockTypes = filePanel ? allowedFileTypes : [],
  updateData,
  onChange,
  onEscapeClick,
  onEnterClick,
  onFocus,
  onTextDifference,
}: BlockNoteProps) => {
  const mode = useUIStore((state) => state.mode);
  const wasInitial = useRef(false);
  const editor = useCreateBlockNote({ schema: customSchema, trailingBlock });
  const isMobile = useBreakpoints("max", "sm");
  const pathname = usePathname();

  const isCreationMode = !!onChange;
  const [text, setText] = useState<string>(defaultValue);

  const emojiPicker = slashMenu
    ? [...customSlashIndexedItems, ...customSlashNotIndexedItems].includes(
        "Emoji"
      ) && allowedBlockTypes.includes("emoji")
    : emojis;

  const triggerDataUpdate = async (passedText?: string) => {
    // if user in Side Menu does not update
    if (editor.sideMenu.view?.menuFrozen) return;

    // if user in Formatting Toolbar does not update
    if (editor.formattingToolbar.shown) return;

    // if user in Slash Menu does not update
    if (editor.suggestionMenus.shown) return;

    // if user in file panel does not update
    if (editor.filePanel?.shown) return;

    const textToUpdate = passedText ?? text;
    // Check if there is any difference in the content
    if (await compareIsContentSame(editor, defaultValue)) return;

    updateData(textToUpdate);
  };

  const onBlockNoteChange = useCallback(async () => {
    if (!editor?.document) return;

    // Converts the editor's contents from Block objects to HTML and sanitizes it
    const descriptionHtml = await editor.blocksToFullHTML(editor.document);

    const contentSame = await compareIsContentSame(editor, text);
    // Check if there is any difference in the content
    if (!contentSame) onTextDifference?.();

    // Update the state or trigger the onChange callback in creation mode
    if (isCreationMode) onChange?.(descriptionHtml);

    setText(descriptionHtml);
  }, [editor, text, isCreationMode, onChange, onTextDifference]);

  const handleKeyDown: KeyboardEventHandler = async (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onEscapeClick?.();
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();

      // to ensure that blocknote have description
      if (
        editor.document?.some((block) => {
          const content = block.content;
          return (
            Array.isArray(content) &&
            (content as { text: string }[])[0]?.text.trim() !== ""
          );
        })
      ) {
        const blocksToUpdate = handleSubmitOnEnter(editor);
        if (blocksToUpdate) {
          // Converts the editor's contents from Block objects to HTML and sanitizes it
          const descriptionHtml = await editor.blocksToFullHTML(
            editor.document
          );
          triggerDataUpdate(descriptionHtml);
        }
        onEnterClick?.();
      }
    }
  };

  useEffect(() => {
    const blockUpdate = async (html: string) => {
      if (wasInitial.current && !isCreationMode) return;

      if (wasInitial.current && isCreationMode && html !== "") return;

      const blocks = await editor.tryParseHTMLToBlocks(html);

      // Get the current blocks and the new blocks' content as strings to compare them
      const currentBlocks = getContentAsString(editor.document as Block[]);
      const newBlocksContent = getContentAsString(blocks as Block[]);

      // Only replace blocks if the content actually changes
      if (!isCreationMode && currentBlocks === newBlocksContent) return;

      editor.replaceBlocks(editor.document, blocks);

      // Handle focus:
      // 1. In creation mode, focus the editor only if it hasn't been initialized before.
      // 2. Outside creation mode, focus the editor every time.
      if (isCreationMode) {
        if (!wasInitial.current) focusEditor(editor); // Focus only on the first initialization in creation mode
      } else focusEditor(editor); // Always focus when not in creation mode

      // Mark the editor as having been initialized
      wasInitial.current = true;
    };

    blockUpdate(defaultValue);
  }, [defaultValue, editor, isCreationMode]);

  const onBeforeLoadHandle = useCallback(async () => {
    if (
      !wasInitial.current ||
      (await compareIsContentSame(editor, defaultValue))
    )
      return;
    updateData(text);
  }, [text, editor, defaultValue, updateData]);

  const openAttachment: MouseEventHandler = (event) => {
    if (!(altClickOpensPreview && event.altKey)) return;
    const allowedTypes: readonly string[] = allowedFileBlockTypes;
    event.preventDefault();
    editor.formattingToolbar.closeMenu();

    const { type, props } = editor.getTextCursorPosition().block;

    const url = getUrlFromProps(props);
    if (!(allowedTypes.includes(type) && url && url.length > 0)) return;
    const newAttachments: CarouselAttachment[] = [];

    // Collect attachments based on valid file types
    editor.forEachBlock(({ type, props }) => {
      const blockUrl = getUrlFromProps(props);

      if (allowedTypes.includes(type) && blockUrl && blockUrl.length > 0) {
        const filename = blockUrl.split("/").pop() || "File";
        newAttachments.push({
          url: blockUrl,
          filename,
          name: filename,
          contentType: type,
        });
      }
      return true;
    });

    const attachmentNum = newAttachments.findIndex(
      ({ url: newUrl }) => newUrl === url
    );
    openAttachmentDialog(attachmentNum, newAttachments);
  };

  useEffect(() => {
    if (!updateDataOnBeforeLoad) return;
    // const unsubscribe = router.subscribe("onBeforeLoad", onBeforeLoadHandle);
    // return () => unsubscribe();

    onBeforeLoadHandle();
  }, [onBeforeLoadHandle, updateDataOnBeforeLoad]);

  return (
    <BlockNoteView
      className={className}
      data-color-scheme={mode}
      editor={editor}
      emojiPicker={!emojiPicker}
      filePanel={!filePanel}
      formattingToolbar={!formattingToolbar}
      id={id}
      onBlur={() => triggerDataUpdate()}
      onChange={onBlockNoteChange}
      onClick={openAttachment}
      onFocus={onFocus}
      onKeyDown={handleKeyDown}
      shadCNComponents={{
        Button: Button as any,
        DropdownMenu: DropdownMenu as any,
        Popover,
        Tooltip,
        Select,
        Label,
        Input,
        Card,
        Badge,
        Toggle,
        Tabs,
      }}
      sideMenu={false}
      slashMenu={!slashMenu}
      theme={mode}
    >
      {slashMenu && (
        <CustomSlashMenu
          allowedTypes={[...allowedBlockTypes, ...allowedFileBlockTypes]}
          editor={editor}
        />
      )}

      {/* Hide formatting toolbar on mobile */}
      {!isMobile && formattingToolbar && <CustomFormattingToolbar />}

      {/* By default hides on mobile */}
      {sideMenu && (
        <CustomSideMenu
          allowedTypes={[...allowedBlockTypes, ...allowedFileBlockTypes]}
          editor={editor}
        />
      )}

      {members?.length && <Mention editor={editor} members={members} />}

      {emojiPicker && (
        <GridSuggestionMenuController
          columns={8}
          // Changes the Emoji Picker to only have 10 columns & min length of 0.
          minQueryLength={0}
          triggerCharacter={":"}
        />
      )}

      {filePanel && <FilePanelController filePanel={filePanel} />}
    </BlockNoteView>
  );
};
