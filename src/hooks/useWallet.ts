import { ReactNode, createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserProvider, Signer } from 'ethers';
import toast from 'react-hot-toast';
import { SEPOLIA } from '../config/contract';

interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: bigint | null;
  isInstalled: boolean;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToSepolia: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  getSigner: () => Promise<Signer>;
}

const WalletContext = createContext<WalletState | null>(null);
const DISCONNECT_KEY = 'innovatefund:ui-disconnected';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [connecting, setConnecting] = useState(false);
  const providerRef = useRef<BrowserProvider | null>(null);
  const isInstalled = typeof window !== 'undefined' && !!window.ethereum;

  const getProvider = useCallback((): BrowserProvider => {
    if (!window.ethereum) throw new Error('MetaMask is not installed.');
    if (!providerRef.current) providerRef.current = new BrowserProvider(window.ethereum, 'any');
    return providerRef.current;
  }, []);

  const sync = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const cid: string = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(parseInt(cid, 16));
      const uiDisconnected = localStorage.getItem(DISCONNECT_KEY) === '1';
      const accounts: string[] = uiDisconnected ? [] : await window.ethereum.request({ method: 'eth_accounts' });
      const acc = accounts[0] ?? null;
      setAddress(acc);
      if (acc) {
        try {
          setBalance(await getProvider().getBalance(acc));
        } catch {
          setBalance(null);
        }
      } else {
        setBalance(null);
      }
    } catch {
      /* wallet not ready */
    }
  }, [getProvider]);

  useEffect(() => {
    void sync();
    const eth = window.ethereum;
    if (!eth?.on) return;
    const onChange = () => void sync();
    eth.on('accountsChanged', onChange);
    eth.on('chainChanged', onChange);
    return () => {
      eth.removeListener?.('accountsChanged', onChange);
      eth.removeListener?.('chainChanged', onChange);
    };
  }, [sync]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed.');
      window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer');
      return;
    }
    setConnecting(true);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      localStorage.removeItem(DISCONNECT_KEY);
      await sync();
    } catch (e) {
      const code = (e as { code?: number })?.code;
      toast.error(code === 4001 ? 'Connection request rejected.' : 'Could not connect to MetaMask.');
    } finally {
      setConnecting(false);
    }
  }, [sync]);

  // UI-level disconnect only (MetaMask itself cannot be disconnected programmatically).
  const disconnect = useCallback(() => {
    localStorage.setItem(DISCONNECT_KEY, '1');
    setAddress(null);
    setBalance(null);
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA.chainIdHex }] });
    } catch (e) {
      if ((e as { code?: number })?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA.chainIdHex,
                chainName: 'Sepolia',
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: [SEPOLIA.publicRpc],
                blockExplorerUrls: [SEPOLIA.explorer],
              },
            ],
          });
        } catch {
          toast.error('Could not add the Sepolia network.');
        }
      } else if ((e as { code?: number })?.code === 4001) {
        toast.error('Network switch rejected.');
      } else {
        toast.error('Could not switch network.');
      }
    }
    await sync();
  }, [sync]);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    try {
      setBalance(await getProvider().getBalance(address));
    } catch {
      /* ignore */
    }
  }, [address, getProvider]);

  const getSigner = useCallback(async (): Promise<Signer> => {
    if (!address) throw new Error('Connect your wallet first.');
    if (chainId !== SEPOLIA.chainId) throw new Error('Please switch MetaMask to the Sepolia network.');
    return getProvider().getSigner();
  }, [address, chainId, getProvider]);

  const value = useMemo<WalletState>(
    () => ({
      address,
      chainId,
      balance,
      isInstalled,
      isConnected: !!address,
      isCorrectNetwork: chainId === SEPOLIA.chainId,
      connecting,
      connect,
      disconnect,
      switchToSepolia,
      refreshBalance,
      getSigner,
    }),
    [address, chainId, balance, isInstalled, connecting, connect, disconnect, switchToSepolia, refreshBalance, getSigner],
  );

  return createElement(WalletContext.Provider, { value }, children);
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside <WalletProvider>');
  return ctx;
}
