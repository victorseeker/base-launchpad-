'use client';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 注意：这里需要你去 cloud.walletconnect.com 免费申请一个 ID，暂时可以先随便填几个数字测试
const projectId = 'b56e4a2431478229b936d812bd529729'; // 这是一个公共测试ID，上线前请换成你自己的
const metadata = { 
  name: 'Base Inscriptions', 
  description: 'Fair Launch on Base', 
  url: 'http://localhost:3000', 
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