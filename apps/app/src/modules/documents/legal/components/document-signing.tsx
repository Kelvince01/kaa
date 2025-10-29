"use client";

/**
 * Document Signing Component
 *
 * Component for signing legal documents
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { format } from "date-fns";
import { CheckCircle2, FileText, Loader2, PenTool, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSignDocument } from "../legal-document.queries";
import { useLegalDocumentStore } from "../legal-document.store";
import type { PartyType } from "../legal-document.type";

type DocumentSigningProps = {
  open?: boolean;
  onClose?: () => void;
  documentId?: string;
};

const formSchema = z.object({
  partyType: z.enum(["landlord", "tenant", "guarantor", "witness", "agent"]),
  signatureText: z.string().min(1, "Signature is required"),
});

export function DocumentSigning({
  open,
  onClose,
  documentId: propDocumentId,
}: DocumentSigningProps) {
  const { isSigningModalOpen, setSigningModalOpen, currentDocument } =
    useLegalDocumentStore();

  const isOpen = open ?? isSigningModalOpen;
  const document = currentDocument;
  const documentId = propDocumentId || document?._id;

  const handleClose = () => {
    onClose?.();
    setSigningModalOpen(false);
  };

  const { mutate: signDocument, isPending } = useSignDocument();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partyType: "tenant",
      signatureText: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!documentId) return;

    // Create signature hash (in real app, this would be more sophisticated)
    const signatureHash = btoa(
      `${values.partyType}:${values.signatureText}:${Date.now()}`
    );

    signDocument(
      {
        documentId,
        partyType: values.partyType as PartyType,
        signatureHash,
      },
      {
        onSuccess: () => {
          handleClose();
          form.reset();
        },
      }
    );
  };

  const hasSignature = (partyType: PartyType) =>
    document?.signatures?.some((sig) => sig.party === partyType);

  const getSignatureInfo = (partyType: PartyType) =>
    document?.signatures?.find((sig) => sig.party === partyType);

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Sign Document
          </DialogTitle>
          <DialogDescription>
            Review and sign the legal document. Your digital signature will be
            recorded.
          </DialogDescription>
        </DialogHeader>

        {document && (
          <div className="space-y-6">
            {/* Document Info */}
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center gap-2 font-semibold">
                <FileText className="h-4 w-4" />
                {document.type.replace(/_/g, " ")}
              </div>
              <div className="text-muted-foreground text-sm">
                Generated: {format(new Date(document.createdAt), "PPP")}
              </div>
              {document.verified && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Shield className="h-4 w-4" />
                  Document verified
                </div>
              )}
            </div>

            {/* Existing Signatures */}
            {document?.signatures?.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Existing Signatures
                </h3>
                <div className="space-y-2">
                  {document?.signatures?.map((sig, index) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-3"
                      key={`${sig.party}-${index}`}
                    >
                      <div>
                        <div className="font-medium capitalize">
                          {sig.party}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Signed: {format(new Date(sig.signedAt), "PPp")}
                        </div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signing Form */}
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                <FormField
                  control={form.control}
                  name="partyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sign as</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="landlord">Landlord</SelectItem>
                          <SelectItem value="tenant">Tenant</SelectItem>
                          <SelectItem value="guarantor">Guarantor</SelectItem>
                          <SelectItem value="witness">Witness</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                      {hasSignature(field.value as PartyType) && (
                        <Alert>
                          <AlertDescription>
                            This party has already signed this document on{" "}
                            {format(
                              new Date(
                                getSignatureInfo(field.value as PartyType)
                                  ?.signedAt || new Date()
                              ),
                              "PPp"
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="signatureText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Digital Signature</FormLabel>
                      <FormControl>
                        <Textarea
                          className="font-signature text-2xl"
                          placeholder="Type your full name as it appears on your ID"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        By typing your name, you agree that this constitutes
                        your digital signature and has the same legal effect as
                        a handwritten signature.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your signature will be cryptographically secured and
                    timestamped. This document will be legally binding once
                    signed by all required parties.
                  </AlertDescription>
                </Alert>

                <DialogFooter>
                  <Button onClick={handleClose} type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button
                    disabled={
                      isPending ||
                      hasSignature(form.watch("partyType") as PartyType)
                    }
                    type="submit"
                  >
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign Document
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
