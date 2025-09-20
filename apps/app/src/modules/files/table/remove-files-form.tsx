import { DeleteForm } from "@/components/common/delete-form";
import { dialog } from "@/components/common/dialoger/state";
import { useFileDeleteMutation } from "../file.mutations";
import type { FileType } from "../file.type";

type Props = {
  organizationId: string;
  files: FileType[];
  callback?: (attachments: FileType[]) => void;
  dialog?: boolean;
};

const RemoveFilesForm = ({
  files,
  organizationId,
  callback,
  dialog: isDialog,
}: Props) => {
  const { mutate: deleteAttachments, isPending } = useFileDeleteMutation();

  const onRemove = async () => {
    await deleteAttachments({
      ids: files.map(({ _id }) => _id),
      orgIdOrSlug: organizationId,
    });

    if (isDialog) dialog.remove();
    callback?.(files);
  };

  return (
    <DeleteForm
      onCancel={() => dialog.remove()}
      onDelete={onRemove}
      pending={isPending}
    />
  );
};

export default RemoveFilesForm;
