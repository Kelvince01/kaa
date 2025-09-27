// /** biome-ignore-all lint/performance/useTopLevelRegex: handlebars regex */
// import CodeMirrorBase, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
// import { useTheme } from "next-themes";
// import { forwardRef, JSX, useEffect, useImperativeHandle, useRef, useState } from "react";
// import { Button } from "@kaa/ui/components/button";
// import { Eye } from "lucide-react";
// // import { HandlebarsPreviewDialog } from "./handlebars-preview-dialog";
// import type { TemplateVariable } from "../template.type";

// // Handlebars language support for CodeMirror
// const handlebarsLanguage = {
//   name: "handlebars",
//   parser: {
//     parse: (input: string) => {
//       // Basic Handlebars parser for syntax highlighting
//       const tokens: { type: string; start: number; end: number; value: string }[] = [];
//       const regex = /(\{\{[#/]?[^}]+\}\})/g;
//       let match: RegExpExecArray | null = null;

//       while ((match = regex.exec(input)) !== null) {
//         tokens.push({
//           type: "handlebars",
//           start: match.index,
//           end: match.index + match[0].length,
//           value: match[0],
//         });
//       }

//       return { tokens, length: input.length };
//     },
//   },
// };

// export type HandlebarsFormEditorProps = {
//   value: string;
//   onChange: (value: string) => void;
//   variables?: TemplateVariable[];
//   placeholder?: string;
//   className?: string;
//   disabled?: boolean;
//   required?: boolean;
// }

// export type HandlebarsFormEditorRef = {
//   focus: () => void;
//   getValue: () => string;
// }

// const HandlebarsFormEditor = forwardRef<HandlebarsFormEditorRef, HandlebarsFormEditorProps>(
//   ({ value, onChange, variables = [], placeholder, className, disabled, required }, ref) => {
//     const { theme } = useTheme();
//     const editorRef = useRef<ReactCodeMirrorRef>(null);
//     const [editorTheme, setEditorTheme] = useState<"light" | "dark">("light");
//     const [isPreviewOpen, setIsPreviewOpen] = useState(false);
//     const [hasValidHandlebars, setHasValidHandlebars] = useState(true);

//     useEffect(() => {
//       setEditorTheme(
//         theme === "system"
//           ? window.matchMedia("(prefers-color-scheme: dark)").matches
//             ? "dark"
//             : "light"
//           : theme === "dark"
//             ? "dark"
//             : "light"
//       );
//     }, [theme]);

//     // Basic Handlebars validation
//     useEffect(() => {
//       if (value) {
//         // Check for basic Handlebars syntax issues
//         const openTags = (value.match(/\{\{[^#/]/g) || []).length;
//         const closeTags = (value.match(/\{\{\//g) || []).length;
//         const conditionals = (value.match(/\{\{#if\s+\w+\}\}/g) || []).length;
//         const conditionalEnds = (value.match(/\{\{\/if\}\}/g) || []).length;
//         const loops = (value.match(/\{\{#each\s+\w+\}\}/g) || []).length;
//         const loopEnds = (value.match(/\{\{/each\}\}/g) || []).length;

//         const hasMatchingTags = openTags >= closeTags;
//         const hasMatchingConditionals = conditionals === conditionalEnds;
//         const hasMatchingLoops = loops === loopEnds;

//         setHasValidHandlebars(hasMatchingTags && hasMatchingConditionals && hasMatchingLoops);
//       } else {
//         setHasValidHandlebars(true); // Empty is valid
//       }
//     }, [value]);

//     const handleChange = (newValue: string) => {
//       onChange(newValue);
//     };

//     useImperativeHandle(ref, () => ({
//       focus: () => {
//         editorRef.current?.view?.focus();
//       },
//       getValue: () => value,
//     }));

//     // Generate sample data from variables
//     const generateSampleData = () => {
//       const sampleData: Record<string, any> = {};

//       for (const variable of variables) {
//         if (variable.defaultValue !== undefined) {
//           sampleData[variable.name] = variable.defaultValue;
//         } else {
//           // Provide sample values based on type
//           switch (variable.type) {
//             case "string":
//               sampleData[variable.name] = `Sample ${variable.name}`;
//               break;
//             case "number":
//               sampleData[variable.name] = 123;
//               break;
//             case "boolean":
//               sampleData[variable.name] = true;
//               break;
//             case "date":
//               sampleData[variable.name] = new Date().toISOString().split('T')[0];
//               break;
//             case "array":
//               sampleData[variable.name] = ["item1", "item2", "item3"];
//               break;
//             case "object":
//               sampleData[variable.name] = { key: "value", nested: { prop: "data" } };
//               break;
//             default:
//               sampleData[variable.name] = `Sample ${variable.name}`;
//               break;
//           }
//         }
//       }

//       return sampleData;
//     };

//     const sampleData = generateSampleData();

//     return (
//       <div className={className}>
//         <CodeMirrorBase
//           ref={editorRef}
//           value={value}
//           onChange={handleChange}
//           placeholder={placeholder}
//           disabled={disabled}
//           extensions={[
//             // Basic syntax highlighting for Handlebars
//             {
//               name: "handlebars",
//               token: (stream) => {
//                 // biome-ignore lint/performance/useTopLevelRegex: handlebars regex
//                 if (stream.match(/\{\{[#/]?[^}]+\}\}/)) {
//                   return "handlebars";
//                 }
//                 stream.next();
//                 return null;
//               },
//             },
//           ]}
//           basicSetup={{
//             lineNumbers: true,
//             highlightActiveLineGutter: true,
//             highlightSpecialChars: true,
//             history: true,
//             foldGutter: true,
//             drawSelection: true,
//             allowMultipleSelections: true,
//             indentOnInput: true,
//             syntaxHighlighting: true,
//             bracketMatching: true,
//             closeBrackets: true,
//             autocompletion: true,
//             rectangularSelection: true,
//             crosshairCursor: true,
//             highlightActiveLine: true,
//             highlightSelectionMatches: true,
//             closeBracketsKeymap: true,
//             defaultKeymap: true,
//             searchKeymap: true,
//             historyKeymap: true,
//             foldKeymap: true,
//             completionKeymap: true,
//             lintKeymap: true,
//           }}
//           style={{
//             minHeight: "400px",
//             fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
//             fontSize: "14px",
//           }}
//           theme={editorTheme}
//         />

//         {required && !value && (
//           <div className="mt-1 text-sm text-destructive">
//             Handlebars content is required
//           </div>
//         )}

//         {value && !hasValidHandlebars && (
//           <div className="mt-1 text-amber-600 dark:text-amber-400 text-sm">
//             Warning: Handlebars syntax may be malformed. Check for unmatched
//             tags or incorrect expressions.
//           </div>
//         )}

//         {/* Available Variables Info */}
//         {variables.length > 0 && (
//           <div className="mt-2 p-3 bg-muted rounded-md">
//             <div className="text-sm font-medium text-muted-foreground mb-2">
//               Available Variables:
//             </div>
//             <div className="flex flex-wrap gap-1">
//               {variables.map((variable) => (
//                 // biome-ignore lint/a11y/useKeyWithClickEvents: false positive
// // biome-ignore lint/a11y/noNoninteractiveElementInteractions: false positive
// <code
//                   key={variable.name}
//                   className="text-xs bg-background px-2 py-1 rounded border cursor-pointer hover:bg-accent"
//                   onClick={() => {
//                     const cursor =
//                       editorRef.current?.view?.state.selection.main.head;
//                     if (cursor !== undefined) {
//                       const before = value.substring(0, cursor);
//                       const after = value.substring(cursor);
//                       const insertText = `{{${variable.name}}}`;
//                       onChange(before + insertText + after);
//                       // Focus and move cursor after insertion
//                       setTimeout(() => {
//                         editorRef.current?.view?.dispatch({
//                           selection: { anchor: cursor + insertText.length },
//                         });
//                         editorRef.current?.view?.focus();
//                       }, 0);
//                     }
//                   }}
//                   title={`Click to insert {{${variable.name}}} - ${variable.description}`}
//                 >
//                   {variable.name}
//                 </code>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Preview Button */}
//         <div className="mt-3 flex justify-end">
//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={() => setIsPreviewOpen(true)}
//             disabled={!value || value.trim().length === 0}
//           >
//             <Eye className="mr-2 h-4 w-4" />
//             Preview Template
//           </Button>
//         </div>

//         {/* Preview Dialog */}
//         <HandlebarsPreviewDialog
//           isOpen={isPreviewOpen}
//           onClose={() => setIsPreviewOpen(false)}
//           templateContent={value}
//           sampleData={sampleData}
//           title="Handlebars Template Preview"
//         />
//       </div>
//     );
//   }
//   );

// HandlebarsFormEditor.displayName = "HandlebarsFormEditor";

// export default HandlebarsFormEditor;
