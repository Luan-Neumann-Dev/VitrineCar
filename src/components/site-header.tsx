"use client";

import { Car, Eye, Lock, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { WhatsAppIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { site, whatsappLink } from "@/lib/site";

/**
 * Tres variantes, como no design: vitrine publica (cadeado + WhatsApp), painel
 * logado (ver como visitante + sair) e tela de login (so a marca).
 */
export function SiteHeader({
  authed,
  onLogout,
}: {
  authed: boolean;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isPanel = isAdminRoute && authed;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50">
            <Car className="size-[19px] stroke-[1.75]" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <strong className="text-[15px] font-semibold tracking-tight">
              {site.name}
            </strong>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {site.tagline}
            </span>
          </span>
        </Link>

        {!isAdminRoute && (
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="size-[38px] rounded-md text-muted-foreground"
            >
              <Link href="/admin" title="Área do vendedor" aria-label="Área do vendedor">
                <Lock className="size-[15px] stroke-[1.75]" />
              </Link>
            </Button>
            <Button asChild className="h-[38px] rounded-md">
              <a
                href={whatsappLink(
                  `Olá! Vi o catálogo da ${site.name} e gostaria de mais informações sobre os carros disponíveis.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="size-[15px]" />
                <span className="hidden sm:inline">Falar no WhatsApp</span>
                <span className="sm:hidden">WhatsApp</span>
              </a>
            </Button>
          </div>
        )}

        {isPanel && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="h-[38px] rounded-md">
              <Link href="/">
                <Eye className="size-[15px] stroke-[1.75]" />
                <span className="hidden sm:inline">Ver como visitante</span>
                <span className="sm:hidden">Vitrine</span>
              </Link>
            </Button>
            <Button onClick={onLogout} className="h-[38px] rounded-md">
              <LogOut className="size-[15px] stroke-[1.75]" />
              Sair
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
