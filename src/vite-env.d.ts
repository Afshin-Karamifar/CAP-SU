/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JIRA_DOMAIN: string;
  readonly VITE_ENCRYPTION_KEY: string;
  readonly VITE_SESSION_TIMEOUT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
