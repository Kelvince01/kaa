"use client";

import { useState } from "react";

export default function TestPage() {
  const [value, setValue] = useState("");
  const [blocknoteId] = useState("test");

  return (
    // <BlockNote
    //   allowedBlockTypes={["emoji", "heading", "paragraph", "codeBlock"]}
    //   allowedFileBlockTypes={["image", "file"]}
    //   className="min-h-20 rounded-md border p-3 pr-6 pl-10"
    //   defaultValue={value}
    //   filePanel={(props) => <UppyFilePanel {...props} />}
    //   id={blocknoteId} // Restrict to image and file uploads
    //   onChange={(value) => setValue(value)} // Use only specific block types
    //   updateData={(html) => setValue(html)}
    // />
    <div>
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
