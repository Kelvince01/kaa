type PageContainerProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export function PageContainer({
  title,
  description,
  children,
}: PageContainerProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4">
        {title && <h1 className="font-bold text-2xl">{title}</h1>}
        {description && <p className="text-muted-foreground">{description}</p>}
        {children}
      </div>
    </div>
  );
}
