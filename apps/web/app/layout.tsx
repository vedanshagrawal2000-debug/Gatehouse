import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GATEHOUSE — Enterprise AI Governance & Operations Platform',
  description: 'Autonomous Business Infrastructure & Multi-Agent Orchestration with Human-in-the-Loop Governance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAFAFA] text-[#111111] antialiased min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
