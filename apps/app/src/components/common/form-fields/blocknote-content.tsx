import { config } from "@kaa/config";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import DOMPurify from "dompurify";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { Control } from "react-hook-form";
// import { BlockNote } from "@/components/common/blocknote";
import UppyFilePanel from "@/modules/files/upload/blocknote-upload-panel";

export const BlockNote = dynamic(
  () => import("@/components/common/blocknote"),
  { ssr: false }
);

import "@/components/common/blocknote/app-specific-custom/styles.css";
import "@/components/common/blocknote/styles.css";

type Props = {
  control: Control<any>;
  name: string;
  label: string;
  blocknoteId: string;
  required?: boolean;
  disabled?: boolean;
};

const BlockNoteContent = ({
  blocknoteId,
  control,
  label,
  name,
  required,
  disabled,
}: Props) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => {
        const sanitizedOnChange = (value: string) => {
          const config = {
            ADD_ATTR: ["colwidth", "style"], // Allow 'colwidth' and 'style' attributes in the sanitized HTML
          };

          //Sanitize BlockNote content
          const cleanContent = DOMPurify.sanitize(value, config);
          onChange(cleanContent);
        };

        return (
          <FormItem aria-disabled={disabled} name={name}>
            <FormLabel>
              {label}
              {required && <span className="ml-1 opacity-50">*</span>}
            </FormLabel>
            <FormControl>
              <Suspense>
                <BlockNote
                  allowedBlockTypes={[
                    "emoji",
                    "heading",
                    "paragraph",
                    "codeBlock",
                  ]}
                  className="flex min-h-20 w-full rounded-md border border-input p-3 pr-6 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-focus-visible:ring-transparent max-focus-visible:ring-offset-0"
                  defaultValue={value}
                  id={blocknoteId}
                  onChange={sanitizedOnChange}
                  updateData={sanitizedOnChange}
                  {...(config.has.imado
                    ? {
                        allowedFileBlockTypes: ["image", "file"],
                        filePanel: (props) => <UppyFilePanel {...props} />,
                      }
                    : ({} as {
                        allowedFileBlockTypes?: never;
                        filePanel?: never;
                      }))}
                />
              </Suspense>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default BlockNoteContent;
