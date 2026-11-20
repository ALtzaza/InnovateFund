import { isAddress } from 'ethers';

export const CONTRACT_ADDRESS: string = (import.meta.env.VITE_CONTRACT_ADDRESS ?? '').trim();
export const SEPOLIA_RPC_URL: string = (import.meta.env.VITE_SEPOLIA_RPC_URL ?? '').trim();
export const DEPLOY_BLOCK: number = Number(import.meta.env.VITE_DEPLOY_BLOCK ?? 0) || 0;
export const LOG_BLOCK_RANGE: number = Number(import.meta.env.VITE_LOG_BLOCK_RANGE ?? 5000) || 5000;

export const IS_CONTRACT_CONFIGURED: boolean = isAddress(CONTRACT_ADDRESS);

export const SEPOLIA = {
  chainId: 11155111,
  chainIdHex: '0xaa36a7',
  name: 'Sepolia',
  explorer: 'https://sepolia.etherscan.io',
  publicRpc: 'https://ethereum-sepolia-rpc.publicnode.com',
} as const;

export const txUrl = (hash: string) => `${SEPOLIA.explorer}/tx/${hash}`;
export const addressUrl = (addr: string) => `${SEPOLIA.explorer}/address/${addr}`;
