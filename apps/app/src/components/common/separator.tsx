const Separator = ({ className }: { className?: string }) => {
  return (
    <hr
      className={`border-gray-200 border-dashed dark:border-gray-700 ${className}`}
    />
  );
};

export default Separator;
