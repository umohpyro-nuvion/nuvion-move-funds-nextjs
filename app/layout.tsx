import { Figtree } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/Store";
import Shell from "@/components/Shell";

const figtree = Figtree({ subsets: ["latin"], variable: "--font" });

export const metadata = { title: "Mercato: send money within Nuvion", description: "A demo marketplace that runs every Nuvion book-transfer scenario in the sandbox." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable} data-theme="system" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.dataset.theme=localStorage.getItem("theme")||"system"` }} />
      </head>
      <body>
        <StoreProvider><Shell>{children}</Shell></StoreProvider>
      </body>
    </html>
  );
}
