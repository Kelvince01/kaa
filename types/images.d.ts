declare module "*.png" {
  const value: string;
  //@ts-expect-error
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  //@ts-expect-error
  export default value;
}

declare module "*.jpg" {
  const value: string;
  //@ts-expect-error
  export default value;
}
