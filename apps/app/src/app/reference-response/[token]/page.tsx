"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ReferenceResponseForm } from "@/modules/references/components/forms/reference-response-form";
import { ReferenceType } from "@/modules/references/reference.type";

type ReferenceResponsePageProps = {
  params: Promise<{ token: string }>;
};

// In a real application, this would fetch the reference details from your API
// For now, we'll mock the data
const fetchReferenceByToken = (token: string) => {
  // Mock implementation - replace with actual API call
  if (!token || token.length < 10) {
    return null;
  }

  return {
    token,
    referenceType: ReferenceType.EMPLOYER,
    referenceProvider: {
      name: "John Doe",
      email: "john@example.com",
      relationship: "Manager",
    },
    tenantName: "Jane Smith",
    customMessage:
      "Please provide a reference for Jane who is applying for a rental property.",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    isValid: true,
  };
};

export default function ReferenceResponsePage({
  params,
}: ReferenceResponsePageProps) {
  const [referenceData, setReferenceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = use(params);
  const router = useRouter();

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setLoading(true);
        const data = await fetchReferenceByToken(token);

        if (!data) {
          // notFound();
          router.push("/");
        }

        setReferenceData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load reference data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, [token, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
          <p className="text-gray-600">Loading reference request...</p>
        </div>
      </div>
    );
  }

  if (error || !referenceData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-4 font-bold text-2xl text-red-600">Error</h1>
          <p className="text-gray-600">
            {error || "Reference request not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ReferenceResponseForm
        customMessage={referenceData.customMessage}
        expiresAt={referenceData.expiresAt}
        referenceProvider={referenceData.referenceProvider}
        referenceType={referenceData.referenceType}
        tenantName={referenceData.tenantName}
        token={referenceData.token}
      />
    </div>
  );
}
