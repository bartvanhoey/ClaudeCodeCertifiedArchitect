import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Support System',
  description: 'AI-powered customer support with specialized subagents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 dark:bg-black text-black dark:text-white">
        {children}
      </body>
    </html>
  );
}
