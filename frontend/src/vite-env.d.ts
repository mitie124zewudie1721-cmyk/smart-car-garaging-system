// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_APP_NAME?: string;
    readonly VITE_GOOGLE_MAPS_API_KEY?: string;
    // Add more env variables here as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}