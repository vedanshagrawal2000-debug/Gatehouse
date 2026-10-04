import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GATEHOUSE // Tactical AI Operations Command Post',
  description: 'Autonomous Business Infrastructure & Multi-Agent Orchestration Post with Fail-Safe Human Gating',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-on-surface antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
