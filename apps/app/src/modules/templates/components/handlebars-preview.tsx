import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Separator } from "@kaa/ui/components/separator";
import { useEffect, useState } from "react";

const HandlebarsPreview = ({
  content,
  data,
}: {
  content: string;
  data: Record<string, any>;
}) => {
  const [handlebarsContent, setHandlebarsContent] = useState(content);
  const [error, setError] = useState("");
  const [dataError, setDataError] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    setHandlebarsContent(content);
  }, [content]);

  // Simple Handlebars implementation
  const compileTemplate = (template: string, context: Record<string, any>) => {
    try {
      let compiled = template;

      // Handle {{#if}} blocks
      compiled = compiled.replace(
        /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
        (_, condition, content) => {
          return context[condition] ? content : "";
        }
      );

      // Handle {{#unless}} blocks
      compiled = compiled.replace(
        /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
        (_, condition, content) => {
          return context[condition] ? content : "";
        }
      );

      // Handle {{#each}} blocks
      compiled = compiled.replace(
        /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
        (_, arrayName, content) => {
          if (!(context[arrayName] && Array.isArray(context[arrayName]))) {
            return "";
          }
          return context[arrayName]
            .map((item) => {
              return content.replace(/\{\{this\}\}/g, item);
            })
            .join("");
        }
      );

      // Handle simple variable substitutions
      compiled = compiled.replace(/\{\{(\w+)\}\}/g, (_, variable) => {
        return context[variable] !== undefined ? context[variable] : "";
      });

      return compiled;
    } catch (err) {
      throw new Error(
        `Template compilation error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  };

  const renderTemplate = () => {
    try {
      setError("");
      setDataError("");

      // Parse JSON data
      let parsedData: Record<string, any>;
      try {
        parsedData = JSON.parse(JSON.stringify(data));
      } catch (err) {
        setDataError("Invalid JSON data format");
        return;
      }

      // Compile template
      const result = compileTemplate(handlebarsContent, parsedData);
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: useEffect
  useEffect(() => {
    renderTemplate();
  }, [handlebarsContent, data]);

  return <div>{output}</div>;
};

export type HandlebarsPreviewDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  handlebarsContent: string;
  title?: string;
  data: Record<string, any>;
};

const HandlebarsPreviewDialog = ({
  isOpen,
  onClose,
  handlebarsContent,
  title = "Handlebars Template Preview",
  data,
}: HandlebarsPreviewDialogProps) => {
  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>
            Preview how your Handlebars template will render
          </DialogDescription>

          {handlebarsContent ? (
            <div className="mt-4">
              <HandlebarsPreview content={handlebarsContent} data={data} />
            </div>
          ) : (
            <div className="mt-4">
              <p>No Handlebars content provided</p>
            </div>
          )}
        </DialogHeader>
        <HandlebarsHelper />
      </DialogContent>
    </Dialog>
  );
};

// Help Section
const HandlebarsHelper = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Handlebars Syntax Guide for Text Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-semibold">Variables</h4>
            <code className="block rounded bg-gray-100 p-2">
              {"{{firstName}} {{lastName}}"}
            </code>
            <p className="mt-1 text-gray-600 text-xs">Insert dynamic values</p>

            <h4 className="mt-4 mb-2 font-semibold">Conditionals</h4>
            <code className="block rounded bg-gray-100 p-2">
              {"{{#if promoCode}}\nUse code: {{promoCode}}\n{{/if}}"}
            </code>
            <p className="mt-1 text-gray-600 text-xs">
              Show content only if condition is true
            </p>

            <h4 className="mt-4 mb-2 font-semibold">Unless (Negative If)</h4>
            <code className="block rounded bg-gray-100 p-2">
              {"{{#unless verified}}\nPlease verify your account\n{{/unless}}"}
            </code>
            <p className="mt-1 text-gray-600 text-xs">
              Show content only if condition is false
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Lists/Arrays</h4>
            <code className="block rounded bg-gray-100 p-2">
              {"{{#each items}}\n- {{this}}\n{{/each}}"}
            </code>
            <p className="mt-1 text-gray-600 text-xs">
              Loop through array items
            </p>

            <h4 className="mt-4 mb-2 font-semibold">SMS Example</h4>
            <code className="block rounded bg-gray-100 p-2 text-xs">
              {
                "Hi {{name}}!\n\n{{#if code}}\nYour code: {{code}}\n{{/if}}\n\nThanks!"
              }
            </code>

            <h4 className="mt-4 mb-2 font-semibold">Email Subject</h4>
            <code className="block rounded bg-gray-100 p-2 text-xs">
              {"Welcome to {{appName}}, {{firstName}}!"}
            </code>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="rounded-lg bg-blue-50 p-4">
          <h4 className="mb-2 font-semibold text-blue-900">
            💡 Tips for Text Templates
          </h4>
          <ul className="space-y-1 text-blue-800 text-sm">
            <li>• Keep SMS messages under 160 characters for single SMS</li>
            <li>• Use clear, concise language for better readability</li>
            <li>
              • Test with different data values to ensure proper formatting
            </li>
            <li>• Consider line breaks and spacing for better text flow</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export { HandlebarsPreview, HandlebarsPreviewDialog, HandlebarsHelper };
