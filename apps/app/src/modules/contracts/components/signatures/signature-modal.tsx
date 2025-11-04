"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@kaa/ui/components/radio-group";
import { Separator } from "@kaa/ui/components/separator";
import {
  CheckCircle,
  FileSignature,
  RotateCcw,
  Shield,
  Upload,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";
import {
  type ContractSigningFormData,
  contractSigningSchema,
} from "../../contract.schema";
import type { Contract } from "../../contract.type";

// Move the hook import inline to the function to avoid accidental use in non-component context
// (This alone does not resolve an invalid hook call, but helps ensure they're always called in a React component function)
type SignatureModalProps = {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (contract: Contract) => void;
};

export function SignatureModal({
  contract,
  open,
  onClose,
  onSuccess,
}: SignatureModalProps) {
  // MOVE useSignContract HOOK HERE to avoid invalid hook call
  // This ensures that the hook is only called when this component is rendered, not on external function or in improper place
  const { useSignContract } = require("../../contract.queries");
  const signContractMutation = useSignContract();

  const [signatureType, setSignatureType] = useState<
    "digital" | "electronic" | "wet"
  >("digital");
  const [hasWitness, setHasWitness] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "signature" | "witness" | "confirm"
  >("signature");

  const signaturePadRef = useRef<SignatureCanvas>(null);
  const witnessPadRef = useRef<SignatureCanvas>(null);

  const form = useForm<ContractSigningFormData>({
    resolver: zodResolver(contractSigningSchema),
    defaultValues: {
      signatureType: "digital",
      signatureData: "",
      witnessName: "",
      witnessSignature: "",
    },
  });

  if (!contract) return null;

  // Clear signature pad
  const clearSignature = () => {
    signaturePadRef.current?.clear();
    form.setValue("signatureData", "");
  };

  // Clear witness signature pad
  const clearWitnessSignature = () => {
    witnessPadRef.current?.clear();
    form.setValue("witnessSignature", "");
  };

  // Save signature as base64
  const saveSignature = () => {
    if (signaturePadRef.current?.isEmpty()) {
      toast.error("Please provide your signature");
      return false;
    }

    const signatureData = signaturePadRef.current?.toDataURL();
    form.setValue("signatureData", signatureData || "");
    return true;
  };

  // Save witness signature as base64
  const saveWitnessSignature = () => {
    if (hasWitness) {
      if (witnessPadRef.current?.isEmpty()) {
        toast.error("Please provide witness signature");
        return false;
      }

      const witnessSignatureData = witnessPadRef.current?.toDataURL();
      form.setValue("witnessSignature", witnessSignatureData || "");
    }
    return true;
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === "signature") {
      if (!saveSignature()) return;

      if (hasWitness) {
        setCurrentStep("witness");
      } else {
        setCurrentStep("confirm");
      }
    } else if (currentStep === "witness") {
      if (!saveWitnessSignature()) return;
      setCurrentStep("confirm");
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep === "confirm") {
      setCurrentStep(hasWitness ? "witness" : "signature");
    } else if (currentStep === "witness") {
      setCurrentStep("signature");
    }
  };

  // Submit signature
  const onSubmit = async (data: ContractSigningFormData) => {
    try {
      const signatureData = {
        ...data,
        signatureType,
      };

      const response = await signContractMutation.mutateAsync({
        id: contract._id,
        data: signatureData,
      });

      toast.success("Contract signed successfully!");

      if (onSuccess && response.contract) {
        onSuccess(response.contract);
      }

      onClose();
      form.reset();
      setCurrentStep("signature");
      setHasWitness(false);
    } catch (error) {
      toast.error("Failed to sign contract. Please try again.");
      console.error("Contract signing error:", error);
    }
  };

  // Reset form and close
  const handleClose = () => {
    form.reset();
    setCurrentStep("signature");
    setHasWitness(false);
    onClose();
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Sign Contract
          </DialogTitle>
          <DialogDescription>
            Contract #{contract._id.slice(-8)} - Digital Signature Process
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center gap-2 ${currentStep === "signature" ? "text-primary" : "text-muted-foreground"}`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === "signature" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    1
                  </div>
                  <span className="font-medium text-sm">Signature</span>
                </div>

                {hasWitness && (
                  <>
                    <div className="w-8 border-muted-foreground border-t" />
                    <div
                      className={`flex items-center gap-2 ${currentStep === "witness" ? "text-primary" : "text-muted-foreground"}`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === "witness" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        2
                      </div>
                      <span className="font-medium text-sm">Witness</span>
                    </div>
                  </>
                )}

                <div className="w-8 border-muted-foreground border-t" />
                <div
                  className={`flex items-center gap-2 ${currentStep === "confirm" ? "text-primary" : "text-muted-foreground"}`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === "confirm" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    {hasWitness ? "3" : "2"}
                  </div>
                  <span className="font-medium text-sm">Confirm</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Step 1: Signature */}
            {currentStep === "signature" && (
              <div className="space-y-6">
                {/* Signature Type Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Signature Method</CardTitle>
                    <CardDescription>
                      Choose how you'd like to sign this contract
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="signatureType"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              className="space-y-3"
                              onValueChange={(value) => {
                                setSignatureType(
                                  value as "digital" | "electronic" | "wet"
                                );
                                field.onChange(value);
                              }}
                              value={signatureType}
                            >
                              <div className="flex items-center space-x-2 rounded-lg border p-3">
                                <RadioGroupItem id="digital" value="digital" />
                                <div className="flex-1">
                                  <Label
                                    className="font-medium"
                                    htmlFor="digital"
                                  >
                                    Digital Signature
                                  </Label>
                                  <p className="text-muted-foreground text-sm">
                                    Draw your signature using mouse or touch
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 rounded-lg border p-3">
                                <RadioGroupItem
                                  id="electronic"
                                  value="electronic"
                                />
                                <div className="flex-1">
                                  <Label
                                    className="font-medium"
                                    htmlFor="electronic"
                                  >
                                    Electronic Signature
                                  </Label>
                                  <p className="text-muted-foreground text-sm">
                                    Type your name as electronic signature
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 rounded-lg border p-3">
                                <RadioGroupItem id="wet" value="wet" />
                                <div className="flex-1">
                                  <Label className="font-medium" htmlFor="wet">
                                    Wet Signature
                                  </Label>
                                  <p className="text-muted-foreground text-sm">
                                    Upload a scanned copy of your handwritten
                                    signature
                                  </p>
                                </div>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Signature Canvas */}
                {signatureType === "digital" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Your Signature
                      </CardTitle>
                      <CardDescription>
                        Please sign in the box below
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-4">
                        <SignatureCanvas
                          backgroundColor="rgb(255,255,255)"
                          canvasProps={{
                            width: 600,
                            height: 200,
                            className: "signature-canvas w-full border rounded",
                            style: { maxWidth: "100%" },
                          }}
                          ref={signaturePadRef}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={clearSignature}
                          type="button"
                          variant="outline"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Clear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Electronic Signature */}
                {signatureType === "electronic" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Electronic Signature</CardTitle>
                      <CardDescription>
                        Type your full name as your electronic signature
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="electronicName">Full Name</Label>
                          <Input
                            id="electronicName"
                            onChange={(e) =>
                              form.setValue("signatureData", e.target.value)
                            }
                            placeholder="Enter your full name"
                          />
                        </div>
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            By typing your name, you agree that this constitutes
                            your electronic signature.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Wet Signature Upload */}
                {signatureType === "wet" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload Signature</CardTitle>
                      <CardDescription>
                        Upload a clear image of your handwritten signature
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-8 text-center">
                          <Upload className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
                          <div className="space-y-2">
                            <p className="font-medium text-sm">
                              Upload signature image
                            </p>
                            <p className="text-muted-foreground text-xs">
                              PNG, JPG up to 2MB. Clear background preferred.
                            </p>
                          </div>
                          <Input
                            accept="image/*"
                            className="mt-4"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  form.setValue(
                                    "signatureData",
                                    event.target?.result as string
                                  );
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            type="file"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Witness Option */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Witness Signature
                    </CardTitle>
                    <CardDescription>
                      Some contracts require a witness signature for legal
                      validity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <input
                        checked={hasWitness}
                        className="rounded border-gray-300"
                        id="hasWitness"
                        onChange={(e) => setHasWitness(e.target.checked)}
                        type="checkbox"
                      />
                      <Label htmlFor="hasWitness">
                        This contract requires a witness signature
                      </Label>
                    </div>
                    {hasWitness && (
                      <div className="mt-4 rounded-lg bg-muted/50 p-4">
                        <p className="text-muted-foreground text-sm">
                          After you complete your signature, you'll be asked to
                          provide witness details and obtain their signature.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Witness Signature */}
            {currentStep === "witness" && (
              <div className="space-y-6">
                {/* Witness Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Witness Information
                    </CardTitle>
                    <CardDescription>
                      Enter the details of your witness
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="witnessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Witness Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter witness full name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Witness Signature */}
                <Card>
                  <CardHeader>
                    <CardTitle>Witness Signature</CardTitle>
                    <CardDescription>
                      Have your witness sign in the box below
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-4">
                      <SignatureCanvas
                        backgroundColor="rgb(255,255,255)"
                        canvasProps={{
                          width: 600,
                          height: 200,
                          className: "signature-canvas w-full border rounded",
                          style: { maxWidth: "100%" },
                        }}
                        ref={witnessPadRef}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={clearWitnessSignature}
                        type="button"
                        variant="outline"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === "confirm" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Confirm Signature
                    </CardTitle>
                    <CardDescription>
                      Please review your signature details before submitting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">
                          Contract ID
                        </Label>
                        <div className="font-medium">
                          #{contract._id.slice(-8)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">
                          Signature Type
                        </Label>
                        <div className="font-medium capitalize">
                          {signatureType}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">
                          Signing Date
                        </Label>
                        <div className="font-medium">
                          {new Date().toLocaleDateString()}
                        </div>
                      </div>
                      {hasWitness && (
                        <div>
                          <Label className="text-muted-foreground">
                            Witness
                          </Label>
                          <div className="font-medium">
                            {form.watch("witnessName") || "Not specified"}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        By submitting this signature, you confirm that you have
                        read, understood, and agree to all terms and conditions
                        of this contract. This signature is legally binding.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <DialogFooter>
              <div className="flex w-full justify-between">
                <div>
                  {currentStep !== "signature" && (
                    <Button
                      onClick={handlePrevious}
                      type="button"
                      variant="outline"
                    >
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleClose} type="button" variant="outline">
                    Cancel
                  </Button>
                  {currentStep !== "confirm" ? (
                    <Button onClick={handleNext} type="button">
                      Next
                    </Button>
                  ) : (
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      disabled={signContractMutation.isPending}
                      type="submit"
                    >
                      {signContractMutation.isPending
                        ? "Signing..."
                        : "Complete Signature"}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
