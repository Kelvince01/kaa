import * as TablePrimitive from "@rn-primitives/table";
import * as React from "react";

import { cn } from "../../lib/utils";
import { TextClassContext } from "./text";

const Table = React.forwardRef<
  React.ElementRef<typeof TablePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TablePrimitive.Root>
>(({ className, ...props }, ref) => (
  <TablePrimitive.Root
    className={cn("w-full caption-bottom text-sm", className)}
    ref={ref}
    {...props}
  />
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  React.ElementRef<typeof TablePrimitive.Header>,
  React.ComponentPropsWithoutRef<typeof TablePrimitive.Header>
>(({ className, ...props }, ref) => (
  <TablePrimitive.Header
    className={cn("border-border [&_tr]:border-b", className)}
    ref={ref}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  React.ElementRef<typeof TablePrimitive.Body>,
  React.ComponentPropsWithoutRef<typeof TablePrimitive.Body>
>(({ className, style, ...props }, ref) => (
  <TablePrimitive.Body
    className={cn("flex-1 border-border [&_tr:last-child]:border-0", className)}
    ref={ref}
    style={[{ minHeight: 2 }, style]}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  React.ElementRef<typeof TablePrimitive.Footer>,
  React.ComponentPropsWithoutRef<typeof TablePrimitive.Footer>
>(({ className, ...props }, ref) => (
  <TablePrimitive.Footer
    className={cn("bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
    ref={ref}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  React.ElementRef<typeof TablePrimitive.Row>,
  React.ComponentPropsWithoutRef<typeof TablePrimitive.Row>
>(({ className, ...props }, ref) => (
  <TablePrimitive.Row
    className={cn(
      "flex-row border-border border-b web:transition-colors web:hover:bg-muted/50 web:data-[state=selected]:bg-muted",
      className
    )}
    ref={ref}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  React.ElementRef<typeof TablePrimitive.Head>,
  React.ComponentPropsWithoutRef<typeof TablePrimitive.Head>
>(({ className, ...props }, ref) => (
  <TextClassContext.Provider value="text-muted-foreground">
    <TablePrimitive.Head
      className={cn(
        "h-12 justify-center px-4 text-left font-medium [&:has([role=checkbox])]:pr-0",
        className
      )}
      ref={ref}
      {...props}
    />
  </TextClassContext.Provider>
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  React.ElementRef<typeof TablePrimitive.Cell>,
  React.ComponentPropsWithoutRef<typeof TablePrimitive.Cell>
>(({ className, ...props }, ref) => (
  <TablePrimitive.Cell
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    ref={ref}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
