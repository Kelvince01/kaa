import { useEditorState } from "@tiptap/react";
import Dialog from "../../components/ui/Dialog";
// import MediaLibrary from "@/components/MediaLibrary";
import useModal from "../../hooks/useModal";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const ImageButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: ctx.editor.isActive("image"),
      disabled: !ctx.editor.isEditable,
    }),
  });

  const { open, handleOpen, handleClose } = useModal();

  return (
    <>
      <MenuButton
        icon="Image"
        tooltip="Image"
        {...state}
        onClick={handleOpen}
      />
      <Dialog onOpenChange={handleClose} open={open}>
        {/*<MediaLibrary onClose={handleClose} onInsert={(image)=>{*/}
        {/*  editor*/}
        {/*    .chain()*/}
        {/*    .focus()*/}
        {/*    .insertImage({*/}
        {/*      src: image.url,*/}
        {/*      width: image.width,*/}
        {/*      height: image.height,*/}
        {/*    })*/}
        {/*    .run();*/}
        {/*  handleClose();*/}
        {/*}}/>*/}
        <div>
          <input
            accept="image/*"
            hidden
            onChange={(e) => {
              const target = e.target;
              const file = target.files?.[0];
              if (file?.type.startsWith("image/")) {
                const url = URL.createObjectURL(file);
                editor.chain().setImage({ src: url }).focus().run();
              }
            }}
            type="file"
          />
        </div>
      </Dialog>
    </>
  );
};

export default ImageButton;
