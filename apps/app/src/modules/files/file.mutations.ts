import { config } from "@kaa/config";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { toaster } from "@/components/common/toaster";
import { compareQueryKeys } from "@/query/helpers/compare-query-keys";
import {
  formatUpdatedData,
  getCancelingRefetchQueries,
  getQueries,
  getQueryItems,
} from "@/query/helpers/mutate-query";
import { queryClient } from "@/query/query-client";
import type { ContextProp, InfiniteQueryData, QueryData } from "@/query/types";
import { nanoid } from "@/shared/utils/nanoid";
import { filesKeys } from "./file.queries";
import { createFiles, deleteFiles, updateFile } from "./file.service";
import type { FileType } from "./file.type";
import { LocalFileStorage } from "./local-file-storage";

type FileQueryData = QueryData<FileType>;
export type FileInfiniteQueryData = InfiniteQueryData<FileType>;
type FileContextProp = ContextProp<FileType, string[] | null>;

const limit = config.requestLimits.files;

export const useFileCreateMutation = () =>
  useMutation<FileType[], Error, { files: FileType[]; orgIdOrSlug: string }>({
    mutationKey: filesKeys.create(),
    mutationFn: createFiles,
  });

export const useFileUpdateMutation = () =>
  useMutation<
    FileType,
    Error,
    { id: string; file: Partial<FileType>; orgIdOrSlug: string }
  >({
    mutationKey: filesKeys.update(),
    mutationFn: updateFile,
  });

export const useFileDeleteMutation = () =>
  useMutation<boolean, Error, { ids: string[]; orgIdOrSlug: string }>({
    mutationKey: filesKeys.delete(),
    mutationFn: deleteFiles,
  });

const t: any = {
  common: {
    success: {
      create_resources: "Files created successfully",
    },
    error: {
      create_resources: "Failed to create files",
    },
  },
};

const handleError = (
  action: "create" | "update" | "delete" | "deleteMany",
  context?: FileContextProp[]
) => {
  if (context?.length) {
    for (const [queryKey, previousData] of context)
      queryClient.setQueryData(queryKey, previousData);
  }

  if (action === "deleteMany")
    toast.error(t("errors.delete_resources", { resource: t("common.files") }));
  else
    toast.error(t(`error.${action}_resource`, { resource: t("common.file") }));
};

queryClient.setMutationDefaults(filesKeys.create(), {
  mutationFn: createFiles,
  onMutate: async (variables) => {
    const { files, orgIdOrSlug } = variables;

    const context: FileContextProp[] = []; // previous query data for rollback if an error occurs
    const optimisticIds: string[] = []; // IDs of optimistically updated items
    const newFiles: FileType[] = [];

    // If multiple attachments, create a groupId for optimistically update to associate them.
    // BE will assign final groupId during attachment creation.
    const groupId = files.length > 1 ? nanoid() : null;

    for (const file of files) {
      const optimisticId = file._id || nanoid();

      // Make newAttachment satisfy Attachment type for optimistic update
      const newFile: FileType = {
        ...file,
        name: file.name.split(".").slice(0, -1).join("."),
        _id: optimisticId,
        // entity: "file",
        createdAt: new Date().toISOString(),
        // createdBy: null,
        updatedAt: new Date().toISOString(),
        // updatedBy: null,
        // groupId,
      };

      newFiles.push(newFile);
      optimisticIds.push(optimisticId);
    }

    // Get affected queries
    const exactKey = filesKeys.table({ orgIdOrSlug });
    const similarKey = filesKeys.similar({ orgIdOrSlug });
    const queries = await getCancelingRefetchQueries<FileType>(
      exactKey,
      similarKey
    );

    // Iterate over affected queries and optimistically update cache
    for (const [queryKey, previousData] of queries) {
      if (!previousData) continue;

      queryClient.setQueryData<FileInfiniteQueryData | FileQueryData>(
        queryKey,
        (oldData) => {
          if (!oldData) return oldData;

          const prevItems = getQueryItems(oldData);
          const updatedItems = [...newFiles, ...prevItems];

          return formatUpdatedData(
            oldData,
            updatedItems,
            limit,
            newFiles.length
          );
        }
      );

      context.push([queryKey, previousData, optimisticIds]); // Store previous data for rollback if needed
    }

    return context;
  },

  onSuccess: (createdFiles, { orgIdOrSlug }, context) => {
    const exactKey = filesKeys.table({ orgIdOrSlug });
    const similarKey = filesKeys.similar({ orgIdOrSlug });

    const queries = getQueries<FileType>(exactKey, similarKey);

    for (const query of queries) {
      const [activeKey] = query;

      queryClient.setQueryData<FileInfiniteQueryData | FileQueryData>(
        activeKey,
        (oldData) => {
          if (!oldData) return oldData;

          const prevItems = getQueryItems(oldData);

          // Get optimisticIds
          const [_, __, optimisticIds] =
            context.find(([key]) => compareQueryKeys(key, activeKey)) ?? [];
          const ids = optimisticIds || [];

          // Replace optimistic updates with real server data
          const optimisticFiles = createdFiles.filter((el: FileType) =>
            ids.includes(el._id)
          );

          const updatedItems = prevItems.map((item) => {
            const createdItem = optimisticFiles.find(
              (created: FileType) => created._id === item._id
            );
            return createdItem ? { ...item, ...createdItem } : item;
          });

          return formatUpdatedData(oldData, updatedItems, limit); // Already update total in mutate
        }
      );
    }
    toast.success(
      t("common.success.create_resources", {
        resources: t("common.files"),
      })
    );
  },
  onError: (_, __, context) => handleError("create", context),
});

queryClient.setMutationDefaults(filesKeys.update(), {
  mutationFn: updateFile,
  onMutate: async (variables: {
    id: string;
    file: Partial<FileType>;
    orgIdOrSlug: string;
  }) => {
    const { orgIdOrSlug } = variables;

    const context: FileContextProp[] = []; // previous query data for rollback if an error occurs
    const optimisticIds: string[] = []; // IDs of optimistically updated items

    // Get affected queries
    const exactKey = filesKeys.table({ orgIdOrSlug });
    const similarKey = filesKeys.similar({ orgIdOrSlug });
    const queries = await getCancelingRefetchQueries<FileType>(
      exactKey,
      similarKey
    );

    // Iterate over affected queries and optimistically update cache
    for (const [queryKey, previousData] of queries) {
      if (!previousData) continue;

      queryClient.setQueryData<FileInfiniteQueryData | FileQueryData>(
        queryKey,
        (oldData) => {
          if (!oldData) return oldData; // Handle missing data

          const prevItems = getQueryItems(oldData);
          const updatedItems = prevItems.map((item) =>
            item._id === variables.id ? { ...item, ...variables.file } : item
          );

          return formatUpdatedData(oldData, updatedItems, limit);
        }
      );

      optimisticIds.push(variables.id); // Track optimistically updated item IDs
      context.push([queryKey, previousData, optimisticIds]); // Store previous data for rollback if needed
    }

    return context;
  },
  onSuccess: async (updatedFile, { orgIdOrSlug }, context) => {
    // Get affected queries
    const exactKey = filesKeys.table({ orgIdOrSlug });
    const similarKey = filesKeys.similar({ orgIdOrSlug });
    const queries = await getQueries<FileType>(exactKey, similarKey);

    for (const query of queries) {
      const [activeKey] = query;
      queryClient.setQueryData<FileInfiniteQueryData | FileQueryData>(
        activeKey,
        (oldData) => {
          if (!oldData) return oldData;

          const prevItems = getQueryItems(oldData);

          // Get optimisticIds
          const [_, __, optimisticIds] =
            context.find(([key]) => compareQueryKeys(key, activeKey)) ?? [];
          const ids = optimisticIds || [];

          // Replace optimistic items with the updated file
          const updatedFiles = prevItems.map((item) =>
            ids.includes(item._id) ? { ...item, ...updatedFile } : item
          );

          return formatUpdatedData(oldData, updatedFiles);
        }
      );
    }
  },
  onError: (_, __, context) => handleError("update", context),
});

queryClient.setMutationDefaults(filesKeys.delete(), {
  mutationFn: deleteFiles,
  onMutate: async (variables) => {
    const { ids, orgIdOrSlug } = variables;

    LocalFileStorage.removeFiles(ids); // delete attachments from indexedDB also

    const context: FileContextProp[] = []; // previous query data for rollback if an error occurs

    // Get affected queries
    const exactKey = filesKeys.table({ orgIdOrSlug });
    const similarKey = filesKeys.similar({ orgIdOrSlug });
    const queries = await getCancelingRefetchQueries<FileType>(
      exactKey,
      similarKey
    );

    // Iterate over affected queries and optimistically update cache
    for (const [queryKey, previousData] of queries) {
      if (!previousData) continue;

      queryClient.setQueryData<FileInfiniteQueryData | FileQueryData>(
        queryKey,
        (oldData) => {
          if (!oldData) return oldData;

          const prevItems = getQueryItems(oldData);
          const updatedItems = prevItems.filter(
            (item) => !ids.includes(item._id)
          );

          return formatUpdatedData(oldData, updatedItems, limit, -ids.length);
        }
      );

      context.push([queryKey, previousData, null]); // Store previous data for potential rollback
    }

    return context;
  },
  onSuccess: () =>
    toaster(
      t("common.success.delete_resources", {
        resources: t("common.files"),
      }),
      "success"
    ),
  onError: (_, { ids }, context) =>
    handleError(ids.length > 1 ? "deleteMany" : "delete", context),
});
