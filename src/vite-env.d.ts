/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS?: string;
  readonly VITE_SEPOLIA_RPC_URL?: string;
  readonly VITE_DEPLOY_BLOCK?: string;
  readonly VITE_LOG_BLOCK_RANGE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Window {
  ethereum?: any;
}
