/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WORLD_URL: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
