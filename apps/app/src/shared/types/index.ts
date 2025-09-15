export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type EmptyProps<T extends React.ElementType> = Omit<
  React.ComponentProps<T>,
  keyof React.ComponentProps<T>
>;

export type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export type QueryBuilderOpts = {
  distinct?: boolean;
  nullish?: boolean;
};
