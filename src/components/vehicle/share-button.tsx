"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ShareButton({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const share = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelar o menu nativo nao e erro: cai no copiar abaixo.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast("Copie o link da barra de endereço");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={share}
      className={cn("h-10 rounded-md", className)}
    >
      <Share2 className="size-[15px] stroke-[1.75]" />
      Compartilhar
    </Button>
  );
}
