"use client";

import { usePathname } from "next/navigation";

import { plural } from "@/lib/format";
import { prettyPhone, site, whatsappLink } from "@/lib/site";

export function SiteFooter({ availableCount }: { availableCount: number }) {
  // O painel nao leva rodape de vitrine: ali o rodape so rouba espaco.
  if (usePathname().startsWith("/admin")) return null;

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 pt-7 pb-24">
        <p className="text-[13px] text-muted-foreground">
          {site.name} · {plural(availableCount, "veículo", "veículos")} no pátio ·{" "}
          {site.hours}
        </p>
        <a
          href={whatsappLink(`Olá! Vi o catálogo da ${site.name}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          WhatsApp {prettyPhone()}
        </a>
      </div>
    </footer>
  );
}
