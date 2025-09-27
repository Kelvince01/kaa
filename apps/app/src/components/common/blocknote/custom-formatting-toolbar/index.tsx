import {
  ColorStyleButton,
  CreateLinkButton,
  FileCaptionButton,
  FileDownloadButton,
  FileReplaceButton,
  FormattingToolbar,
  FormattingToolbarController,
  NestBlockButton,
  UnnestBlockButton,
} from "@blocknote/react";
import { useEffect } from "react";
import { customFormattingToolBarConfig } from "@/components/common/blocknote/blocknote-config";
import { CustomTextAlignSelect } from "@/components/common/blocknote/custom-formatting-toolbar/custom-align-change";
import { KaaCustomBlockTypeSelect } from "@/components/common/blocknote/custom-formatting-toolbar/custom-block-type-change";
import { CustomTextStyleSelect } from "@/components/common/blocknote/custom-formatting-toolbar/custom-text-type-change";

export const CustomFormattingToolbar = () => (
  <FormattingToolbarController
    formattingToolbar={() => {
      // to be able to use in sheet
      // biome-ignore lint/correctness/useHookAtTopLevel: required by author
      useEffect(() => {
        const bodyStyle = document.body.style;
        const pointerEventsOnOpen = bodyStyle.pointerEvents;
        bodyStyle.pointerEvents = "auto";

        return () => {
          bodyStyle.pointerEvents = pointerEventsOnOpen;
        };
      }, []);
      return (
        <FormattingToolbar>
          {customFormattingToolBarConfig.blockTypeSelect && (
            <KaaCustomBlockTypeSelect />
          )}
          {customFormattingToolBarConfig.blockStyleSelect && (
            <CustomTextStyleSelect />
          )}
          {customFormattingToolBarConfig.blockAlignSelect && (
            <CustomTextAlignSelect />
          )}

          {customFormattingToolBarConfig.fileCaption && (
            <FileCaptionButton key={"fileCaptionButton"} />
          )}
          {customFormattingToolBarConfig.replaceFile && (
            <FileReplaceButton key={"replaceFileButton"} />
          )}
          <FileDownloadButton key={"downloadButton"} />

          {customFormattingToolBarConfig.textColorSelect && (
            <ColorStyleButton key={"colorStyleButton"} />
          )}

          {customFormattingToolBarConfig.createLink && (
            <CreateLinkButton key={"createLinkButton"} />
          )}

          {customFormattingToolBarConfig.blockNestingSelect && (
            <>
              <NestBlockButton key={"nestBlockButton"} />
              <UnnestBlockButton key={"unnestBlockButton"} />
            </>
          )}
        </FormattingToolbar>
      );
    }}
  />
);
