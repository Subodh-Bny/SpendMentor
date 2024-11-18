import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

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
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            success: {
              style: {
                background: "#1d4ed8", // Use the primary color from CSS variables
                color: "white", // Optionally, adjust the text color to match the foreground color
                padding: "12px 24px",
                borderRadius: "8px",
              },
              duration: 4000, // Duration for success toasts
            },
            error: {
              style: {
                background: "#dc2626", // Use a destructive color for errors (or choose another color)
                color: "white", // Adjust text color for errors
                padding: "12px 24px",
                borderRadius: "8px",
              },
              duration: 4000, // Duration for error toasts
            },
            loading: {
              style: {
                background: "var(--muted)", // A muted background for loading toasts
                color: "var(--muted-foreground)",
                padding: "12px 24px",
                borderRadius: "8px",
              },
              duration: 3000, // Duration for loading toasts
            },
          }}
        />
      </body>
    </html>
  );
}
