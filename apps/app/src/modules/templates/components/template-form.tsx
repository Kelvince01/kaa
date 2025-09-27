"use client";

import type { TiptapEditorRef } from "@kaa/tiptap/editor";
import TiptapEditor from "@kaa/tiptap/editor";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { SlugFormField } from "@/components/common/form-fields/slug";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import type {
  TemplateCreateInput,
  TemplateType,
  TemplateVariable,
} from "../template.type";
import MJMLFormEditor from "./mjml-form-editor";

type TemplateFormProps = {
  template?: TemplateType;
  onSubmit: (data: TemplateCreateInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

const TEMPLATE_ENGINES = [
  { value: "handlebars", label: "Handlebars" },
  { value: "mjml", label: "MJML" },
  { value: "ejs", label: "EJS" },
  { value: "pug", label: "Pug" },
  { value: "nunjucks", label: "Nunjucks" },
] as const;

const TEMPLATE_FORMATS = [
  { value: "html", label: "HTML" },
  { value: "text", label: "Text" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "json", label: "JSON" },
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "Docx" },
  { value: "xlsx", label: "Xlsx" },
  { value: "markdown", label: "Markdown" },
] as const;

const TEMPLATE_CATEGORIES = [
  { value: "email", label: "Email" },
  { value: "document", label: "Document" },
  { value: "report", label: "Report" },
  { value: "notification", label: "Notification" },
  { value: "welcome", label: "Welcome" },
  { value: "payment", label: "Payment" },
  { value: "reminder", label: "Reminder" },
  { value: "verification", label: "Verification" },
  { value: "maintenance", label: "Maintenance" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" },
] as const;

const VARIABLE_TYPES = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "array", label: "Array" },
  { value: "object", label: "Object" },
] as const;

function escapeMJML(mjml: string) {
  return mjml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Dynamic Content Editor Component
function TemplateContentEditor({
  engine,
  field,
}: {
  engine: string;
  field: any;
}) {
  const editorRef = useRef<TiptapEditorRef>(null);

  // const getWordCount = useCallback(
  //   () => editorRef.current?.getInstance()?.storage.characterCount.words() ?? 0,
  //   []
  // );

  // For MJML, use the MJML form editor with syntax highlighting
  if (engine === "mjml") {
    return (
      <MJMLFormEditor
        className="max-h-[600px] min-h-[400px] max-w-[100vh] overflow-x-auto overflow-y-clip"
        onChange={field.onChange}
        placeholder={`
          <mjml>
            <mj-body>
              <mj-section>
                <mj-column>
                  <mj-text>Hello {{name}}!</mj-text>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>`}
        required
        value={field.value || ""}
      />
    );
  }

  // For other engines, use Tiptap Editor
  return (
    <TiptapEditor
      contentMaxHeight={640}
      contentMinHeight={256}
      initialContent={field.value}
      onContentChange={field.onChange}
      output="html"
      placeholder={{
        paragraph: "Type your content here...",
        imageCaption: "Type caption for image (optional)",
      }}
      ref={editorRef}
      ssr={true}
    />

    // <Textarea
    //   className="min-h-[200px]"
    //   onChange={field.onChange}
    //   placeholder={`
    //     <mjml>
    //       <mj-body>
    //         <mj-section>
    //           <mj-column>
    //             <mj-text>Hello {{name}}!</mj-text>
    //           </mj-column>
    //         </mj-section>
    //       </mj-body>
    //     </mjml>`}
    //   value={field.value || ""}
    // />
  );
}

export function TemplateForm({
  template,
  onSubmit,
  onCancel,
  isLoading,
}: TemplateFormProps) {
  const [newTag, setNewTag] = useState("");
  const [newVariable, setNewVariable] = useState<Partial<TemplateVariable>>({
    name: "",
    type: "string",
    required: false,
    description: "",
  });

  const formId = template ? `template-edit-${template._id}` : "template-create";

  const form = useFormWithDraft<TemplateCreateInput>(formId, {
    formOptions: {
      defaultValues: {
        name: template?.name || "",
        description: template?.description || "",
        category: (template?.category as any) || "email",
        type: template?.type || "",
        subject: template?.subject || "",
        content: template?.content || "",
        variables: template?.variables || [],
        engine: (template?.engine as any) || "handlebars",
        format: (template?.format as any) || "html",
        tags: template?.tags || [],
        metadata: template?.metadata || {},
        smsMetadata: template?.smsMetadata,
      },
    },
  });

  const formData = form.watch();
  const name = useWatch({ control: form.control, name: "name" });

  const handleSubmit = async (data: TemplateCreateInput) => {
    const content =
      data.engine === "mjml" ? escapeMJML(data.content) : data.content;

    await onSubmit({ ...data, content });
  };

  const addTag = () => {
    if (newTag.trim() && !(formData.tags || []).includes(newTag.trim())) {
      const currentTags = formData.tags || [];
      form.setValue("tags", [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = formData.tags || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const addVariable = () => {
    if (newVariable.name && newVariable.description) {
      const currentVariables = formData.variables || [];
      form.setValue("variables", [
        ...currentVariables,
        newVariable as TemplateVariable,
      ]);
      setNewVariable({
        name: "",
        type: "string",
        required: false,
        description: "",
      });
    }
  };

  const removeVariable = (index: number) => {
    const currentVariables = formData.variables || [];
    form.setValue(
      "variables",
      currentVariables.filter((_, i) => i !== index)
    );
  };

  const updateVariable = (
    index: number,
    updates: Partial<TemplateVariable>
  ) => {
    const currentVariables = formData.variables || [];
    form.setValue(
      "variables",
      currentVariables.map((variable, i) =>
        i === index ? { ...variable, ...updates } : variable
      )
    );
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the basic settings for your template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        id="name"
                        {...field}
                        placeholder="Template name"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input
                          id="slug"
                          {...field}
                          placeholder="Template slug"
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

              <SlugFormField
                control={form.control}
                description={"Template slug"}
                label={"Slug"}
                nameValue={name}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_CATEGORIES.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        id="description"
                        {...field}
                        placeholder="Template description"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Template type" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="engine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engine</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_ENGINES.map((engine) => (
                          <SelectItem key={engine.value} value={engine.value}>
                            {engine.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_FORMATS.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email subject or SMS title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Template Content */}
        <Card>
          <CardHeader>
            <CardTitle>Template Content</CardTitle>
            <CardDescription>
              Write your template content using the selected engine syntax
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl className={"min-h-[200px]"}>
                      <TemplateContentEditor
                        engine={formData.engine || "handlebars"}
                        field={field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Variables</CardTitle>
            <CardDescription>
              Define variables that can be used in your template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.variables.map((variable, index) => (
              <div
                className="space-y-3 rounded-lg border p-4"
                key={variable.name}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Variable {index + 1}</h4>
                  <Button
                    onClick={() => removeVariable(index)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      onChange={(e) =>
                        updateVariable(index, { name: e.target.value })
                      }
                      placeholder="variableName"
                      value={variable.name}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      onValueChange={(value) =>
                        updateVariable(index, { type: value as any })
                      }
                      value={variable.type}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VARIABLE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Required</Label>
                    <Select
                      onValueChange={(value) =>
                        updateVariable(index, { required: value === "true" })
                      }
                      value={variable.required ? "true" : "false"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    onChange={(e) =>
                      updateVariable(index, { description: e.target.value })
                    }
                    placeholder="Variable description"
                    value={variable.description}
                  />
                </div>
              </div>
            ))}

            <div className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    onChange={(e) =>
                      setNewVariable({ ...newVariable, name: e.target.value })
                    }
                    placeholder="variableName"
                    value={newVariable.name}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    onValueChange={(value) =>
                      setNewVariable({ ...newVariable, type: value as any })
                    }
                    value={newVariable.type}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VARIABLE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    onChange={(e) =>
                      setNewVariable({
                        ...newVariable,
                        description: e.target.value,
                      })
                    }
                    placeholder="Variable description"
                    value={newVariable.description}
                  />
                </div>
              </div>

              <Button
                className="mt-3"
                disabled={!(newVariable.name && newVariable.description)}
                onClick={addVariable}
                type="button"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Variable
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Add tags to help organize and filter your templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag) => (
                <Badge className="px-3 py-1" key={tag} variant="secondary">
                  {tag}
                  <Button
                    className="ml-2 h-auto p-0 hover:bg-transparent"
                    onClick={() => removeTag(tag)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && e.preventDefault() && addTag()
                }
                placeholder="Add a tag"
                value={newTag}
              />
              <Button onClick={addTag} type="button" variant="outline">
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isLoading} type="submit">
            {isLoading
              ? "Saving..."
              : template
                ? "Update Template"
                : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
