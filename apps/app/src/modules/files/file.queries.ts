import { config } from "@kaa/config";
import {
  infiniteQueryOptions,
  useMutation,
  useQuery,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import {
  bulkFileOperation,
  copyFile,
  deleteFile,
  downloadFile,
  extractMetadata,
  generateThumbnail,
  getFileAnalytics,
  getFileById,
  getFilePreviewUrl,
  getFileStats,
  getFiles,
  getFilesWithFilters,
  getFileVersions,
  getOptimizedAssetUrl,
  getPresignedUploadUrl,
  getUserFiles,
  moveFile,
  restoreFileVersion,
  scanFile,
  searchFiles,
  shareFile,
  updateFile_v2,
  uploadDirectToCDN,
  uploadFile,
} from "./file.service";
import type {
  BulkFileOperation,
  FileFilter,
  FileType,
  FileUpdateInput,
  FileUploadInput,
  GetFilesParams,
  OptimizationOptions,
} from "./file.type";

/**
 * Keys for files related queries. These keys help to uniquely identify different query.
 * For managing query caching and invalidation.
 */
export const filesKeys = {
  all: ["files"] as const,
  lists: () => [...filesKeys.all, "list"] as const,
  list: (filters: FileFilter) => [...filesKeys.lists(), filters] as const,
  table: (filters?: GetFilesParams) => [...filesKeys.lists(), filters] as const,
  similar: (filters?: Pick<GetFilesParams, "orgIdOrSlug">) =>
    [...filesKeys.lists(), filters] as const,
  create: () => [...filesKeys.all, "create"] as const,
  update: () => [...filesKeys.all, "update"] as const,
  delete: () => [...filesKeys.all, "delete"] as const,
  details: () => [...filesKeys.all, "detail"] as const,
  detail: (id: string) => [...filesKeys.details(), id] as const,
  search: (query: string) => [...filesKeys.all, "search", query] as const,
  stats: () => [...filesKeys.all, "stats"] as const,
  versions: (id: string) => [...filesKeys.all, "versions", id] as const,
  analytics: (id: string, timeRange?: string) =>
    [...filesKeys.all, "analytics", id, timeRange] as const,
};

/**
 * Infinite Query Options for fetching a paginated list of attachments.
 *
 * This function returns the configuration for querying attachments from target organization with pagination support.
 *
 * @param param.orgIdOrSlug - Organization ID or slug.
 * @param param.q - Optional search query for filtering attachments.
 * @param param.sort - Field to sort by (default: 'createdAt').
 * @param param.order - Order of sorting (default: 'desc').
 * @param param.limit - Number of items per page (default: `config.requestLimits.attachments`).
 * @returns Infinite query options.
 */
export const filesQueryOptions = ({
  orgIdOrSlug,
  q = "",
  sort: initialSort,
  order: initialOrder,
  groupId,
  limit = config.requestLimits.files,
}: GetFilesParams) => {
  const sort = initialSort || "createdAt";
  const order = initialOrder || "desc";

  const queryKey = filesKeys.table({
    orgIdOrSlug,
    q,
    sort,
    order,
    groupId,
  });

  return infiniteQueryOptions({
    queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam: page, signal }) =>
      await getFiles(
        {
          page,
          q,
          sort,
          order,
          limit,
          groupId,
          orgIdOrSlug,
          offset: page * limit,
        },
        signal
      ),
    getNextPageParam: (_lastPage, allPages) => allPages.length,
  });
};

export const useFiles = (params: GetFilesParams) =>
  useSuspenseInfiniteQuery(filesQueryOptions(params));

// Get user files
export const useUserFiles = () => {
  return useQuery({
    queryKey: filesKeys.lists(),
    queryFn: getUserFiles,
    staleTime: 30_000, // 30 seconds
  });
};

// Get file by ID
export const useFile = (id: string) =>
  useQuery({
    queryKey: filesKeys.detail(id),
    queryFn: () => getFileById(id),
    enabled: !!id,
  });

// Upload file
export const useUploadFile = () =>
  useMutation({
    mutationFn: (data: FileUploadInput) => uploadFile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
    },
  });

// Update file
export const useUpdateFile = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: FileUpdateInput }) =>
      updateFile_v2(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: filesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
    },
  });

// Delete file
export const useDeleteFile = () =>
  useMutation({
    mutationFn: deleteFile,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: filesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
    },
  });

// Get presigned upload URL
export const usePresignedUploadUrl = () =>
  useMutation({
    mutationFn: (data: FileUploadInput) => getPresignedUploadUrl(data),
  });

// Get optimized asset URL
export const useOptimizedAssetUrl = (
  path: string,
  options: OptimizationOptions
) => {
  return useQuery({
    queryKey: [...filesKeys.all, "optimize", path, options],
    queryFn: () => getOptimizedAssetUrl(path, options),
    staleTime: Number.POSITIVE_INFINITY, // URLs are immutable
  });
};

// Direct upload to CDN
export const useDirectUpload = () =>
  useMutation({
    mutationFn: ({
      file,
      userId,
      fileName,
    }: {
      file: FileType;
      userId: string;
      fileName: string;
    }) => uploadDirectToCDN(file, userId, fileName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
    },
  });

// Get files with filters
export const useFilesWithFilters = (filters: FileFilter) =>
  useQuery({
    queryKey: filesKeys.list(filters),
    queryFn: () => getFilesWithFilters(filters),
    staleTime: 30_000,
    enabled: Object.keys(filters).length > 0,
  });

// Search files
export const useSearchFiles = (
  query: string,
  options?: { limit?: number; offset?: number }
) =>
  useQuery({
    queryKey: filesKeys.search(query),
    queryFn: () => searchFiles(query, options),
    enabled: query.length > 2,
    staleTime: 30_000,
  });

// Get file statistics
export const useFileStats = () => {
  return useQuery({
    queryKey: filesKeys.stats(),
    queryFn: getFileStats,
    staleTime: 60_000, // 1 minute
  });
};

// Bulk file operations
export const useBulkFileOperation = () =>
  useMutation({
    mutationFn: (operation: BulkFileOperation) => bulkFileOperation(operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: filesKeys.stats() });
    },
  });

// Share file
export const useShareFile = () =>
  useMutation({
    mutationFn: ({
      id,
      settings,
    }: {
      id: string;
      settings: {
        isPublic: boolean;
        allowDownload?: boolean;
        expiresAt?: string;
      };
    }) => shareFile(id, settings),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: filesKeys.detail(id) });
    },
  });

// Download file
export const useDownloadFile = () =>
  useMutation({
    mutationFn: downloadFile,
  });

// Get file preview URL
export const useFilePreviewUrl = (
  id: string,
  options?: { width?: number; height?: number; quality?: number }
) =>
  useQuery({
    queryKey: [...filesKeys.detail(id), "preview", options],
    queryFn: () => getFilePreviewUrl(id, options),
    enabled: !!id,
    staleTime: Number.POSITIVE_INFINITY,
  });

// Copy file
export const useCopyFile = () =>
  useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      copyFile(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
    },
  });

// Move file
export const useMoveFile = () =>
  useMutation({
    mutationFn: ({ id, targetFolder }: { id: string; targetFolder: string }) =>
      moveFile(id, targetFolder),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: filesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
    },
  });

// Get file versions
export const useFileVersions = (id: string) =>
  useQuery({
    queryKey: filesKeys.versions(id),
    queryFn: () => getFileVersions(id),
    enabled: !!id,
  });

// Restore file version
export const useRestoreFileVersion = () =>
  useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) =>
      restoreFileVersion(id, versionId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: filesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: filesKeys.versions(id) });
    },
  });

// Generate thumbnail
export const useGenerateThumbnail = () =>
  useMutation({
    mutationFn: ({
      id,
      options,
    }: {
      id: string;
      options?: { width?: number; height?: number };
    }) => generateThumbnail(id, options),
  });

// Extract metadata
export const useExtractMetadata = () =>
  useMutation({
    mutationFn: extractMetadata,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: filesKeys.detail(id) });
    },
  });

// Scan file
export const useScanFile = () =>
  useMutation({
    mutationFn: scanFile,
  });

// Get file analytics
export const useFileAnalytics = (
  id: string,
  timeRange?: "7d" | "30d" | "90d"
) => {
  return useQuery({
    queryKey: filesKeys.analytics(id, timeRange),
    queryFn: () => getFileAnalytics(id, timeRange),
    enabled: !!id,
    staleTime: 300_000, // 5 minutes
  });
};
