import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { logoutAction } from "@/app/admin/actions";
import { listVehicles } from "@/db/queries";
import { hasSession } from "@/lib/auth";
import { site } from "@/lib/site";

import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });

/**
 * Tudo le o D1 a cada requisicao: com ~10 anuncios a consulta e trivial e
 * evita configurar cache incremental so para isso. Se um dia o volume mudar,
 * da para trocar por ISR sem mexer no resto.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Carros seminovos`,
    template: `%s · ${site.name}`,
  },
  description: `Catálogo de veículos seminovos da ${site.name}. ${site.tagline}`,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const vehicles = await listVehicles();
  const available = vehicles.filter((v) => v.status !== "vendido").length;

  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader authed={await hasSession()} onLogout={logoutAction} />
        {children}
        <SiteFooter availableCount={available} />
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
