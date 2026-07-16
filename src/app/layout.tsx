import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG-Dx Study Platform",
  description: "International physician diagnostic reasoning study comparing GPT with GPT plus OpenScholar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="h-full antialiased"><body className="min-h-full">{children}</body></html>;
}
