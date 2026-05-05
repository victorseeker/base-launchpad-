import './globals.css';
import { Web3Provider } from './Web3Provider';

export const metadata = {
  title: 'ASTEROID Inscription Launcher',
  description: 'Fair Launch on Base Chain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* 用我们自定义的 Provider 包裹住 children */}
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}