/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_WS_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '*.module.scss' {
    const classes: { readonly [key: string]: string };
    export default classes;
}

declare module '*.scss' {
    const classes: { readonly [key: string]: string };
    export default classes;
}

