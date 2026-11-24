/// <reference types="vite/client" />

declare module "@fixtures/*.json" {
  const value: unknown;
  export default value;
}
