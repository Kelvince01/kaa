// import TiptapRenderer from "@kaa/tiptap/client-renderer";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Separator } from "@kaa/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import { Eye, Send, Smartphone } from "lucide-react";
import { useState } from "react";
import type {
  SMSPreviewResponse,
  TemplatePreviewResponse,
  TemplateType,
} from "../template.type";

type TemplatePreviewProps = {
  template: TemplateType;
  onRender: (
    data: Record<string, any>
  ) => Promise<{ data: TemplatePreviewResponse }>;
  onRenderSMS?: (data: Record<string, any>) => Promise<SMSPreviewResponse>;
  onSendTest?: (data: Record<string, any>) => Promise<void>;
};

export function TemplatePreview({
  template,
  onRender,
  onRenderSMS,
  onSendTest,
}: TemplatePreviewProps) {
  const [sampleData, setSampleData] = useState<Record<string, any>>({});
  const [previewResult, setPreviewResult] =
    useState<TemplatePreviewResponse | null>(null);
  const [smsPreviewResult, setSmsPreviewResult] =
    useState<SMSPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "sms">("preview");

  // Initialize sample data with default values from variables
  const initializeSampleData = () => {
    const initialData: Record<string, any> = {};
    for (const variable of template.variables) {
      if (variable.defaultValue !== undefined) {
        initialData[variable.name] = variable.defaultValue;
      } else {
        // Provide sample values based on type
        switch (variable.type) {
          case "string":
            initialData[variable.name] = `Sample ${variable.name}`;
            break;
          case "number":
            initialData[variable.name] = 123;
            break;
          case "boolean":
            initialData[variable.name] = true;
            break;
          case "date":
            initialData[variable.name] = new Date().toISOString().split("T")[0];
            break;
          case "array":
            initialData[variable.name] = ["item1", "item2"];
            break;
          case "object":
            initialData[variable.name] = { key: "value" };
            break;
          default:
            initialData[variable.name] = `Sample ${variable.name}`;
            break;
        }
      }
    }
    setSampleData(initialData);
  };

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const result = await onRender(sampleData);
      console.log(result);
      setPreviewResult(result.data);
    } catch (error) {
      console.error("Preview failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSMSPreview = async () => {
    if (!onRenderSMS) return;

    setIsLoading(true);
    try {
      const result = await onRenderSMS(sampleData);
      setSmsPreviewResult(result);
    } catch (error) {
      console.error("SMS Preview failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!onSendTest) return;

    setIsLoading(true);
    try {
      await onSendTest(sampleData);
    } catch (error) {
      console.error("Send test failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVariableInput = (variable: TemplateType["variables"][0]) => {
    const value = sampleData[variable.name];
    const handleChange = (newValue: any) => {
      setSampleData({ ...sampleData, [variable.name]: newValue });
    };

    switch (variable.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <input
              checked={Boolean(value)}
              className="rounded"
              onChange={(e) => handleChange(e.target.checked)}
              type="checkbox"
            />
            <Label>{variable.description}</Label>
          </div>
        );

      case "number":
        return (
          <div className="space-y-2">
            <Label>{variable.description}</Label>
            <Input
              onChange={(e) => handleChange(Number(e.target.value))}
              placeholder={`Enter ${variable.name}`}
              type="number"
              value={value || ""}
            />
          </div>
        );

      case "date":
        return (
          <div className="space-y-2">
            <Label>{variable.description}</Label>
            <Input
              onChange={(e) => handleChange(e.target.value)}
              type="date"
              value={value || ""}
            />
          </div>
        );

      case "array":
      case "object":
        return (
          <div className="space-y-2">
            <Label>{variable.description}</Label>
            <Textarea
              className="font-mono"
              onChange={(e) => {
                try {
                  handleChange(JSON.parse(e.target.value));
                } catch {
                  handleChange(e.target.value);
                }
              }}
              placeholder={`Enter JSON for ${variable.name}`}
              value={value ? JSON.stringify(value, null, 2) : ""}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label>{variable.description}</Label>
            <Input
              onChange={(e) => handleChange(e.target.value)}
              placeholder={`Enter ${variable.name}`}
              value={value || ""}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Template Preview
          </CardTitle>
          <CardDescription>
            Preview how your template will render with sample data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-medium">{template.name}</h3>
              <p className="text-muted-foreground text-sm">
                {template.description}
              </p>
            </div>
            <Badge>{template.category}</Badge>
            <Badge variant="outline">{template.engine}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sample Data Input */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Data</CardTitle>
            <CardDescription>
              Provide sample values for template variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.variables.length === 0 ? (
              <p className="text-muted-foreground">
                No variables defined for this template.
              </p>
            ) : (
              <>
                <Button
                  className="w-full"
                  onClick={initializeSampleData}
                  type="button"
                  variant="outline"
                >
                  Generate Sample Data
                </Button>

                <div className="space-y-4">
                  {template.variables.map((variable) => (
                    <div className="space-y-2" key={variable.name}>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-sm">
                          {variable.name}
                        </code>
                        <Badge className="text-xs" variant="secondary">
                          {variable.type}
                        </Badge>
                        {variable.required && (
                          <Badge className="text-xs" variant="destructive">
                            Required
                          </Badge>
                        )}
                      </div>
                      {renderVariableInput(variable)}
                    </div>
                  ))}
                </div>
              </>
            )}

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button disabled={isLoading} onClick={handlePreview}>
                <Eye className="mr-2 h-4 w-4" />
                {isLoading ? "Rendering..." : "Preview"}
              </Button>

              {template.category === "email" && onSendTest && (
                <Button
                  disabled={isLoading}
                  onClick={handleSendTest}
                  variant="outline"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Test
                </Button>
              )}

              {(template.category === "sms" || template.smsMetadata) &&
                onRenderSMS && (
                  <Button
                    disabled={isLoading}
                    onClick={handleSMSPreview}
                    variant="outline"
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    SMS Preview
                  </Button>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Output */}
        <Card>
          <CardHeader>
            <CardTitle>Preview Output</CardTitle>
            <CardDescription>
              See how your template renders with the sample data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {template.engine === "mjml" ? (
              <Tabs
                onValueChange={(value) => setActiveTab(value as any)}
                value={activeTab}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mjml">MJML Source</TabsTrigger>
                  <TabsTrigger value="preview">HTML Preview</TabsTrigger>
                </TabsList>

                <TabsContent className="space-y-4" value="mjml">
                  <div>
                    <Label className="font-medium text-sm">MJML Source:</Label>
                    <div className="mt-1 min-h-[300px] w-full overflow-auto rounded-md border bg-muted p-4 font-mono text-sm">
                      <pre className="whitespace-pre-wrap">
                        {sampleData.content || template.content}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent className="space-y-4" value="preview">
                  {previewResult ? (
                    <div className="space-y-4">
                      {previewResult.subject && (
                        <div>
                          <Label className="font-medium text-sm">
                            Subject:
                          </Label>
                          <div className="mt-1 rounded-md bg-muted p-3 font-medium">
                            {previewResult.subject}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="font-medium text-sm">
                          Rendered HTML:
                        </Label>
                        <div
                          className="prose prose-sm mt-1 max-w-none rounded-md bg-muted p-3"
                          // biome-ignore lint/security/noDangerouslySetInnerHtml: safe
                          dangerouslySetInnerHTML={{
                            __html: previewResult.content,
                          }}
                        />
                      </div>

                      <div className="text-muted-foreground text-xs">
                        Render time: {previewResult.metadata.renderTime}ms
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      Click "Preview" to see the rendered MJML template
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : template.category === "email" ||
              template.category === "notification" ? (
              <Tabs
                onValueChange={(value) => setActiveTab(value as any)}
                value={activeTab}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">HTML Preview</TabsTrigger>
                  {onRenderSMS && (
                    <TabsTrigger value="sms">SMS Preview</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent className="space-y-4" value="preview">
                  {previewResult ? (
                    <div className="space-y-4">
                      {previewResult.subject && (
                        <div>
                          <Label className="font-medium text-sm">
                            Subject:
                          </Label>
                          <div className="mt-1 rounded-md bg-muted p-3 font-medium">
                            {previewResult.subject}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="font-medium text-sm">Content:</Label>
                        <div
                          className="prose prose-sm mt-1 max-w-none rounded-md bg-muted p-3"
                          // biome-ignore lint/security/noDangerouslySetInnerHtml: safe
                          dangerouslySetInnerHTML={{
                            __html: previewResult.content,
                          }}
                        />
                      </div>

                      <div className="text-muted-foreground text-xs">
                        Render time: {previewResult.metadata.renderTime}ms
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      Click "Preview" to see the rendered template
                    </div>
                  )}
                </TabsContent>

                {onRenderSMS && (
                  <TabsContent className="space-y-4" value="sms">
                    {smsPreviewResult ? (
                      <div className="space-y-4">
                        <div>
                          <Label className="font-medium text-sm">
                            SMS Content:
                          </Label>
                          <div className="mt-1 rounded-md bg-muted p-3 font-mono text-sm">
                            {smsPreviewResult.rendered}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-muted-foreground text-xs">
                              Segments:
                            </Label>
                            <div className="font-medium">
                              {smsPreviewResult.segments}
                            </div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">
                              Length:
                            </Label>
                            <div className="font-medium">
                              {smsPreviewResult.length} characters
                            </div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">
                              Encoding:
                            </Label>
                            <div className="font-medium">
                              {smsPreviewResult.encoding}
                            </div>
                          </div>
                          {smsPreviewResult.cost && (
                            <div>
                              <Label className="text-muted-foreground text-xs">
                                Estimated Cost:
                              </Label>
                              <div className="font-medium">
                                ${smsPreviewResult.cost.toFixed(4)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        Click "SMS Preview" to see the SMS rendering
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            ) : (
              <div className="space-y-4">
                {previewResult ? (
                  <div>
                    <Label className="font-medium text-sm">Content:</Label>
                    <div className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-sm">
                      {previewResult.content}
                    </div>
                    <div className="mt-2 text-muted-foreground text-xs">
                      Render time: {previewResult.metadata.renderTime}ms
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Click "Preview" to see the rendered template
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
