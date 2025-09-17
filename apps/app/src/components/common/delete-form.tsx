import { Button } from "@kaa/ui/components/button";
import { useTranslations } from "next-intl";
import { SubmitButton } from "@/components/ui/submit-button";

type DeleteFormProps = {
  onDelete: () => void;
  onCancel: () => void;
  pending: boolean;
};

export const DeleteForm = ({
  onDelete,
  onCancel,
  pending,
}: DeleteFormProps) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row">
      <SubmitButton
        aria-label="Delete"
        loading={pending}
        onClick={onDelete}
        variant="destructive"
      >
        {t("common.delete")}
      </SubmitButton>
      <Button
        aria-label="Cancel"
        onClick={onCancel}
        type="reset"
        variant="secondary"
      >
        {t("common.cancel")}
      </Button>
    </div>
  );
};
