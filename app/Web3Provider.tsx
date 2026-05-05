'use client';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 🌟 这里保持你的 ProjectId 不变
const projectId = 'e2e0bc536eda364c6dd67bf0dc76cef1'; 

const metadata = { 
  name: 'Base Inscriptions', 
  description: 'Fair Launch on Base', 
  // ✅ 修改这里：动态获取当前域名，适配本地和 Vercel 线上环境
  url: typeof window !== 'undefined' ? window.location.origin : 'https://www.asteroidonbase.fun', 
  icons: ['https://avatars.githubusercontent.com/u/37784886'] 
};

const config = defaultWagmiConfig({ chains: [base], projectId, metadata });
const queryClient = new QueryClient();

createWeb3Modal({ wagmiConfig: config, projectId });

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}