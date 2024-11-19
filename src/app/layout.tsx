import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import AllContextProvider from "@/context/AllContextProvider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpendWise",
  description: "Track your expenses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <AllContextProvider>
        <body className={`${inter.className} antialiased`}>
          <ThemeProvider attribute="class" disableTransitionOnChange>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                success: {
                  style: {
                    background: "#1d4ed8",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "8px",
                  },
                  duration: 4000,
                },
                error: {
                  style: {
                    background: "#dc2626",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "8px",
                  },
                  duration: 4000,
                },
                loading: {
                  style: {
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                    padding: "12px 24px",
                    borderRadius: "8px",
                  },
                  duration: 3000,
                },
              }}
            />
          </ThemeProvider>
        </body>
      </AllContextProvider>
    </html>
  );
}
