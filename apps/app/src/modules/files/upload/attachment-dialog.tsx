import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { FlameKindling, ServerCrash, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import ContentPlaceholder from "@/components/common/content-placeholder";
import Spinner from "@/components/common/spinner";
import { useOnlineManager } from "@/hooks/use-online-manager";
import { filesQueryOptions } from "@/modules/files/file.queries";
import AttachmentsCarousel from "@/modules/files/upload/carousel";

const AttachmentDialog = ({
  attachmentId,
  groupId,
  orgIdOrSlug,
}: {
  attachmentId: string;
  groupId?: string;
  orgIdOrSlug: string;
}) => {
  const t = useTranslations();
  const { isOnline } = useOnlineManager();

  const { data, isError, isLoading } = useSuspenseInfiniteQuery(
    filesQueryOptions({ groupId, orgIdOrSlug })
  );

  const attachments = data?.pages.flatMap((page: any) => page.files);
  const slides = groupId
    ? attachments
    : attachments.filter(({ id }) => id === attachmentId);

  const startSlide = attachments?.findIndex(({ id }) => attachmentId === id);

  if (isError)
    return (
      <ContentPlaceholder
        Icon={ServerCrash}
        title={t("errors.request_failed")}
      />
    );

  // Show a loading spinner if no cache exists and data is still loading
  if (isLoading) {
    return (
      <div className="block">
        <Spinner className="mt-[40vh] h-10 w-10" />
      </div>
    );
  }

  return slides ? (
    <div className="-z-1 relative flex h-screen grow flex-wrap justify-center p-2">
      <AttachmentsCarousel
        isDialog
        saveInSearchParams={true}
        slide={startSlide}
        slides={slides}
      />
    </div>
  ) : (
    <ContentPlaceholder
      Icon={isOnline ? FlameKindling : WifiOff}
      title={t(`${isOnline ? "errors.no_user_found" : "common.offline.text"}`)}
    />
  );
};

export default AttachmentDialog;
