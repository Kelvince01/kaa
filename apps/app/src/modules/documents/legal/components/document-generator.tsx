"use client";

/**
 * Document Generator Component
 *
 * Component for generating legal documents from templates
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { DeliveryMethod, Language } from "@kaa/models/types";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
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
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useGenerateDocument,
  useTemplate,
  useTemplates,
} from "../legal-document.queries";
import { useLegalDocumentStore } from "../legal-document.store";
import type { TemplateField } from "../legal-document.type";

type DocumentGeneratorProps = {
  open?: boolean;
  onClose?: () => void;
  templateId?: string;
  propertyId?: string;
  tenantId?: string;
  landlordId?: string;
};

const baseFormSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  format: z.enum(["pdf", "html", "docx"]),
  language: z.nativeEnum(Language),
  digitalSignature: z.boolean(),
  watermark: z.string().optional(),
  encryption: z.boolean(),
  password: z.string().optional(),
  copies: z.number().min(1).max(10),
  delivery: z.array(z.nativeEnum(DeliveryMethod)),
});

export function DocumentGenerator({
  open,
  onClose,
  templateId: propTemplateId,
  propertyId,
  tenantId,
  landlordId,
}: DocumentGeneratorProps) {
  const { isGenerateModalOpen, setGenerateModalOpen } = useLegalDocumentStore();
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    propTemplateId || ""
  );
  const [formSchema, setFormSchema] = useState(baseFormSchema);

  const isOpen = open ?? isGenerateModalOpen;
  const handleClose = () => {
    onClose?.();
    setGenerateModalOpen(false);
  };

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useTemplates();

  // Fetch selected template
  const { data: templateData } = useTemplate(
    selectedTemplateId,
    !!selectedTemplateId
  );

  const template = templateData?.template?.fields;

  // Generate document mutation
  const { mutate: generateDocument, isPending } = useGenerateDocument();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      templateId: propTemplateId || "",
      format: "pdf",
      language: Language.ENGLISH,
      digitalSignature: false,
      encryption: false,
      copies: 1,
      delivery: [],
    },
  });

  // Update form schema when template changes
  useEffect(() => {
    if (template) {
      const templateFieldsSchema: Record<string, z.ZodTypeAny> = {};

      for (const field of template) {
        let fieldSchema: z.ZodTypeAny;

        switch (field.type) {
          case "number":
            fieldSchema = z.coerce.number();
            if (field.validation?.min !== undefined) {
              fieldSchema = (fieldSchema as z.ZodNumber).min(
                field.validation.min
              );
            }
            if (field.validation?.max !== undefined) {
              fieldSchema = (fieldSchema as z.ZodNumber).max(
                field.validation.max
              );
            }
            break;
          case "date":
            fieldSchema = z.string();
            break;
          case "boolean":
            fieldSchema = z.boolean().default(false);
            break;
          default:
            fieldSchema = z.string();
            if (field.validation?.min) {
              fieldSchema = (fieldSchema as z.ZodString).min(
                field.validation.min
              );
            }
            if (field.validation?.max) {
              fieldSchema = (fieldSchema as z.ZodString).max(
                field.validation.max
              );
            }
            if (field.validation?.pattern) {
              fieldSchema = (fieldSchema as z.ZodString).regex(
                new RegExp(field.validation.pattern),
                field.validation.message || "Invalid format"
              );
            }
        }

        if (!field.required) {
          fieldSchema = fieldSchema.optional();
        }

        templateFieldsSchema[field.id] = fieldSchema;
      }

      const newSchema = baseFormSchema.extend({
        data: z.object(templateFieldsSchema),
      });

      setFormSchema(newSchema as any);
    }
  }, [template]);

  const handleSubmit = (values: any) => {
    generateDocument(
      {
        ...values,
        propertyId,
        tenantId,
        landlordId,
      },
      {
        onSuccess: () => {
          handleClose();
          form.reset();
        },
      }
    );
  };

  const renderField = (field: TemplateField) => {
    switch (field.type) {
      case "select":
        return (
          <FormField
            control={form.control}
            key={field.id}
            name={`data.${field.id}` as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.name}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <Select
                  defaultValue={formField.value}
                  onValueChange={formField.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          field.placeholder || `Select ${field.name}`
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "textarea":
        return (
          <FormField
            control={form.control}
            key={field.id}
            name={`data.${field.id}` as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.name}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={field.placeholder || `Enter ${field.name}`}
                    {...formField}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "boolean":
        return (
          <FormField
            control={form.control}
            key={field.id}
            name={`data.${field.id}` as any}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{field.name}</FormLabel>
                  {field.description && (
                    <FormDescription>{field.description}</FormDescription>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "date":
        return (
          <FormField
            control={form.control}
            key={field.id}
            name={`data.${field.id}` as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.name}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={field.placeholder || `Enter ${field.name}`}
                    type="date"
                    {...formField}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return (
          <FormField
            control={form.control}
            key={field.name}
            name={`data.${field.id}` as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.name}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={field.placeholder || `Enter ${field.name}`}
                    type={field.type === "number" ? "number" : "text"}
                    {...formField}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Legal Document
          </DialogTitle>
          <DialogDescription>
            Select a template and fill in the required information to generate
            your document.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            {/* Template Selection */}
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template *</FormLabel>
                  <Select
                    defaultValue={field.value}
                    disabled={!!propTemplateId}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedTemplateId(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templatesLoading ? (
                        <div className="p-4 text-center">
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        templatesData?.templates.map((t) => (
                          <SelectItem key={t._id} value={t._id}>
                            {t.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the type of legal document you want to generate
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template Fields */}
            {template && (
              <>
                <div className="border-t pt-4">
                  <h3 className="mb-4 font-semibold text-lg">
                    Document Details
                  </h3>
                  <div className="space-y-4">
                    {template?.map((field) => renderField(field))}
                  </div>
                </div>

                {/* Generation Options */}
                <div className="border-t pt-4">
                  <h3 className="mb-4 font-semibold text-lg">
                    Generation Options
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Format</FormLabel>
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
                              {templateData?.template?.supportedFormats?.map(
                                (format) => (
                                  <SelectItem key={format} value={format}>
                                    {format.toUpperCase()}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
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
                              <SelectItem value={Language.ENGLISH}>
                                English
                              </SelectItem>
                              <SelectItem value={Language.SWAHILI}>
                                Swahili
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="copies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Copies</FormLabel>
                          <FormControl>
                            <Input
                              max={10}
                              min={1}
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseInt(e.target.value, 10)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="watermark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Watermark (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., DRAFT" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="digitalSignature"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Enable digital signature</FormLabel>
                            <FormDescription>
                              Add a digital signature to the document
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="encryption"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Encrypt document</FormLabel>
                            <FormDescription>
                              Protect the document with encryption
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("encryption") && (
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter password"
                                type="password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button onClick={handleClose} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={isPending || !template} type="submit">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Document
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
