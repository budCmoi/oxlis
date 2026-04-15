import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope, Space_Mono, Syne } from "next/font/google";
import { PageTransitionShell } from "@/components/common/page-transition-shell";
import { SmoothScrollProvider } from "@/components/common/smooth-scroll-provider";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="relative flex-1 overflow-x-clip">{children}</main>
      <Footer />
    </>
  );
}

const bodyFont = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const displayFont = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const monoFont = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "OXLIS - Plateforme d'entreprises numeriques",
  description: "Achetez et vendez des entreprises numeriques avec annonces, offres, messagerie et sequestre simule.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-foreground">
        <div className="site-shell min-h-full flex w-full flex-col">
          <AuthProvider>
            <Suspense fallback={<AppShell>{children}</AppShell>}>
              <SmoothScrollProvider>
                <PageTransitionShell>
                  <AppShell>{children}</AppShell>
                </PageTransitionShell>
              </SmoothScrollProvider>
            </Suspense>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
