"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import TiptapEditor, { type TiptapEditorRef } from "@kaa/tiptap/editor";
// import MediaLibrary from "@kaa/tiptap/media-library";
// import SourceEditor from "@kaa/tiptap/source-editor";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/modules/auth";
import { MessagingContainer } from "@/modules/comms/messages";

const testFormSchema = z.object({
  name: z.string(),
  description: z.string(),
});

type TestForm = z.infer<typeof testFormSchema>;

export default function TestPage() {
  const [value, setValue] = useState("");
  const [blocknoteId] = useState("test");
  const editorRef = useRef<TiptapEditorRef>(null);
  const { user } = useAuth();

  const form = useForm<TestForm>({
    resolver: zodResolver(testFormSchema),
  });

  const onSubmit = (values: TestForm) => {
    console.log(values);
  };

  return (
    <div className="mx-4 my-4 flex flex-col">
      <Form {...form}>
        <form
          className="gap-4 space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <TiptapEditor
                    contentMaxHeight={640}
                    contentMinHeight={256}
                    initialContent={field.value}
                    onContentChange={field.onChange}
                    output="html"
                    placeholder={{
                      paragraph: "Type your content here...",
                      imageCaption: "Type caption for image (optional)",
                    }}
                    ref={editorRef}
                    ssr={true}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>

      {/* <MediaLibrary /> */}

      {/* <SourceEditor initialContent="let x: number = 5" /> */}

      <MessagingContainer
        className="h-screen"
        userId={user?.id || ""}
        userName={`${user?.firstName} ${user?.lastName}`}
      />

      <button
        onClick={() => {
          console.log("Upload");
        }}
        type="button"
      >
        Upload
      </button>
      <button
        onClick={() => {
          console.log("Media Library");
        }}
        type="button"
      >
        Media Library
      </button>
    </div>
  );
}
