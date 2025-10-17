/**
 * Example Usage: Watermarking and Malware Scanning
 *
 * This file demonstrates how to use the new watermarking and malware scanning features
 */

import { FileCategory, ImageOperation } from "@kaa/models/file.type";
import { FilesService } from "../files/file-v2.service";

const filesService = new FilesService();

// ==================== EXAMPLE 1: Text Watermark ====================

async function uploadWithTextWatermark(buffer: Buffer, userId: string) {
  const file = await filesService.uploadFile(buffer, "property-photo.jpg", {
    ownerId: userId,
    organizationId: "org-123",
    category: FileCategory.PROPERTY_PHOTOS,
    processingOptions: {
      operation: ImageOperation.WATERMARK,
      parameters: {
        type: "text",
        text: "© 2025 Real Estate Co.",
        position: "bottom-right",
        opacity: 0.6,
        fontSize: 20,
        color: "white",
      },
    },
  });

  return file;
}

// ==================== EXAMPLE 2: Logo Watermark ====================

async function uploadWithLogoWatermark(buffer: Buffer, userId: string) {
  const file = await filesService.uploadFile(buffer, "listing-photo.jpg", {
    ownerId: userId,
    organizationId: "org-123",
    category: FileCategory.PROPERTY_PHOTOS,
    processingOptions: {
      operation: ImageOperation.WATERMARK,
      parameters: {
        type: "image",
        watermarkPath: "./assets/company-logo.png",
        position: "bottom-right",
        opacity: 0.8,
        scale: 0.15, // 15% of image width
      },
    },
  });

  return file;
}

// ==================== EXAMPLE 3: Multiple Watermarks ====================

async function uploadWithMultipleWatermarks(buffer: Buffer, userId: string) {
  // First upload the original
  const originalFile = await filesService.uploadFile(
    buffer,
    "premium-listing.jpg",
    {
      ownerId: userId,
      organizationId: "org-123",
      category: FileCategory.PROPERTY_PHOTOS,
    }
  );

  // Then process with multiple watermarks
  const processedFiles = await filesService.processFile(originalFile.id, [
    // Add text watermark
    {
      operation: ImageOperation.WATERMARK,
      parameters: {
        type: "text",
        text: "PREMIUM LISTING",
        position: "top-left",
        opacity: 0.7,
        fontSize: 28,
        color: "gold",
      },
    },
    // Add logo watermark
    {
      operation: ImageOperation.WATERMARK,
      parameters: {
        type: "image",
        watermarkPath: "./assets/premium-badge.png",
        position: "top-right",
        opacity: 0.9,
        scale: 0.1,
      },
    },
    // Add copyright text
    {
      operation: ImageOperation.WATERMARK,
      parameters: {
        type: "text",
        text: "© 2025 Company Name",
        position: "bottom-left",
        opacity: 0.5,
        fontSize: 16,
        color: "white",
      },
    },
  ]);

  return processedFiles;
}

// ==================== EXAMPLE 4: Conditional Watermarking ====================

async function uploadWithConditionalWatermark(
  buffer: Buffer,
  userId: string,
  isPremium: boolean
) {
  const baseOptions = {
    ownerId: userId,
    organizationId: "org-123",
    category: FileCategory.PROPERTY_PHOTOS,
  };

  // Only add watermark for premium users
  if (isPremium) {
    return await filesService.uploadFile(buffer, "photo.jpg", {
      ...baseOptions,
      processingOptions: {
        operation: ImageOperation.WATERMARK,
        parameters: {
          type: "text",
          text: "PREMIUM",
          position: "center",
          opacity: 0.3,
          fontSize: 48,
          color: "gold",
        },
      },
    });
  }

  return await filesService.uploadFile(buffer, "photo.jpg", baseOptions);
}

// ==================== EXAMPLE 5: Malware Scanning (Automatic) ====================

async function uploadWithSecurityCheck(buffer: Buffer, userId: string) {
  try {
    // Malware scanning happens automatically during upload
    const file = await filesService.uploadFile(buffer, "document.pdf", {
      ownerId: userId,
      organizationId: "org-123",
      category: FileCategory.CONTRACT_DOCS,
    });

    console.log("File uploaded successfully - passed security scan");
    return { success: true, file };
  } catch (error: any) {
    if (error.message.includes("security scan")) {
      console.error("File rejected: Failed malware scan");
      return {
        success: false,
        error: "File contains malicious content",
      };
    }

    throw error;
  }
}

// ==================== EXAMPLE 6: Batch Processing ====================

async function batchUploadWithWatermarks(
  files: Array<{ buffer: Buffer; name: string }>,
  userId: string
) {
  const results = await Promise.allSettled(
    files.map(({ buffer, name }) =>
      filesService.uploadFile(buffer, name, {
        ownerId: userId,
        organizationId: "org-123",
        category: FileCategory.PROPERTY_PHOTOS,
        processingOptions: {
          operation: ImageOperation.WATERMARK,
          parameters: {
            type: "text",
            text: "© 2025 Company",
            position: "bottom-right",
            opacity: 0.6,
          },
        },
      })
    )
  );

  const successful = results.filter((r) => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");

  return {
    successful: successful.length,
    failed: failed.length,
    files: successful.map((r) => (r as PromiseFulfilledResult<any>).value),
  };
}

// ==================== EXAMPLE 7: Different Watermarks by Position ====================

async function createWatermarkVariants(buffer: Buffer, userId: string) {
  const originalFile = await filesService.uploadFile(buffer, "original.jpg", {
    ownerId: userId,
    organizationId: "org-123",
  });

  const positions = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "center",
  ];

  const variants = await Promise.all(
    positions.map((position) =>
      filesService.processFile(originalFile.id, [
        {
          operation: ImageOperation.WATERMARK,
          parameters: {
            type: "text",
            text: "SAMPLE",
            position,
            opacity: 0.5,
            fontSize: 24,
            color: "white",
          },
        },
      ])
    )
  );

  return variants;
}

// ==================== EXAMPLE 8: API Controller Integration ====================

/**
 * Example Elysia controller endpoint
 */
export const fileUploadController = {
  async uploadPropertyImage(request: any) {
    const { file } = request.body;
    const userId = request.user.id;
    const { addWatermark, watermarkText } = request.query;

    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    const uploadOptions: any = {
      ownerId: userId,
      organizationId: request.user.organizationId,
      category: FileCategory.PROPERTY_PHOTOS,
      relatedEntityId: request.body.propertyId,
      relatedEntityType: "property",
    };

    // Add watermark if requested
    if (addWatermark === "true") {
      uploadOptions.processingOptions = {
        operation: ImageOperation.WATERMARK,
        parameters: {
          type: "text",
          text: watermarkText || "© Property Listing",
          position: "bottom-right",
          opacity: 0.6,
          fontSize: 20,
          color: "white",
        },
      };
    }

    try {
      const uploadedFile = await filesService.uploadFile(
        fileBuffer,
        file.name,
        uploadOptions
      );

      return {
        success: true,
        file: {
          id: uploadedFile.id,
          url: uploadedFile.url,
          cdnUrl: uploadedFile.cdnUrl,
          status: uploadedFile.status,
        },
      };
    } catch (error: any) {
      if (error.message.includes("security scan")) {
        return {
          success: false,
          error: "File failed security validation",
          code: "MALWARE_DETECTED",
        };
      }
      throw error;
    }
  },
};

// ==================== EXAMPLE 9: Testing Malware Detection ====================

async function testMalwareDetection() {
  // Create a test file with suspicious content
  const suspiciousContent = Buffer.from(`
    <script>
      eval(atob('malicious code'));
    </script>
  `);

  try {
    await filesService.uploadFile(suspiciousContent, "test.html", {
      ownerId: "test-user",
      organizationId: "test-org",
    });
    console.log("WARNING: Suspicious file was not detected!");
  } catch (error: any) {
    console.log("✓ Malware detection working:", error.message);
  }
}

// ==================== EXAMPLE 10: Custom Watermark Styles ====================

const watermarkPresets = {
  confidential: {
    type: "text",
    text: "CONFIDENTIAL",
    position: "center",
    opacity: 0.3,
    fontSize: 48,
    color: "red",
  },

  draft: {
    type: "text",
    text: "DRAFT",
    position: "center",
    opacity: 0.4,
    fontSize: 64,
    color: "gray",
  },

  copyright: {
    type: "text",
    text: "© 2025 All Rights Reserved",
    position: "bottom-right",
    opacity: 0.6,
    fontSize: 16,
    color: "white",
  },

  premium: {
    type: "text",
    text: "PREMIUM",
    position: "top-right",
    opacity: 0.8,
    fontSize: 32,
    color: "gold",
  },
};

async function uploadWithPreset(
  buffer: Buffer,
  userId: string,
  preset: keyof typeof watermarkPresets
) {
  return await filesService.uploadFile(buffer, "image.jpg", {
    ownerId: userId,
    organizationId: "org-123",
    processingOptions: {
      operation: ImageOperation.WATERMARK,
      parameters: watermarkPresets[preset],
    },
  });
}

// Export examples
export {
  uploadWithTextWatermark,
  uploadWithLogoWatermark,
  uploadWithMultipleWatermarks,
  uploadWithConditionalWatermark,
  uploadWithSecurityCheck,
  batchUploadWithWatermarks,
  createWatermarkVariants,
  testMalwareDetection,
  uploadWithPreset,
  watermarkPresets,
};
