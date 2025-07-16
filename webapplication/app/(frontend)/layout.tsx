import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import BreadcrumbUI from "@/components/breadcumb-ui";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leezencounter",
  description: "TinyAIoT powered Leezenbox Monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <main className="w-full h-screen flex flex-col">
              <div className="flex items-center gap-4 mx-4 mt-4">
                <SidebarTrigger className="cursor-pointer" />
                <BreadcrumbUI />
                <div className="ml-auto">
                  <ModeToggle />
                </div>
              </div>
              <section className="p-4 flex-1 flex flex-col gap-4">
                {children}
              </section>
              <footer className="mt-auto border-t justify-center flex text-gray-500">
                Leezencounter @ Uni Münster
              </footer>
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
