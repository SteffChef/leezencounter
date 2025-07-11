import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import BreadcrumbUI from "@/components/breadcumb-ui";

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <AppSidebar />
          <main className="w-full h-screen flex flex-col">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="cursor-pointer" />
              <BreadcrumbUI />
            </div>
            <section className="p-4 flex-1 flex flex-col gap-4">
              {children}
            </section>
            <footer className="mt-auto border-t justify-center flex text-gray-500">
              Leezencounter @ Uni Münster
            </footer>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
