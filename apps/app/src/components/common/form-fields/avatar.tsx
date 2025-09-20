import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@kaa/ui/components/form";
import type { Control } from "react-hook-form";
import { UploadAvatar } from "@/modules/files/upload/upload-avatar";

type Props = {
  control: Control<any>;
  name: string;
  label: string;
  entity: {
    id?: string;
    name?: string | null;
  };
  type: Parameters<typeof UploadAvatar>[0]["type"];
  url?: string | null;
  setUrl: (url: string | null) => void;
};

const AvatarFormField = ({
  control,
  label,
  name,
  entity,
  type,
  url,
  setUrl,
}: Props) => (
  <FormField
    control={control}
    name={name}
    render={({ field: { ref, ...rest } }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <UploadAvatar
            {...rest}
            id={entity.id}
            name={entity.name}
            setUrl={setUrl}
            type={type}
            url={url}
          />
        </FormControl>
      </FormItem>
    )}
  />
);

export default AvatarFormField;
