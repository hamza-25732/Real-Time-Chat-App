/// <reference types="vite/client" />

/**
 * Declares the `VITE_`-prefixed variables this app reads, so `import.meta.env`
 * is typed rather than an untyped bag. Nothing secret belongs here — everything
 * under this prefix is shipped to the browser.
 */
interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
