import { SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-3 px-5 py-24 text-center">
      <span className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <SearchX className="size-5 stroke-[1.75]" aria-hidden="true" />
      </span>
      <p className="text-[17px] font-semibold">Anúncio não encontrado</p>
      <p className="max-w-[46ch] text-sm text-muted-foreground">
        Esse veículo pode ter sido vendido e retirado da vitrine. Veja o que está
        disponível agora no catálogo.
      </p>
      <Button asChild variant="outline" className="mt-1 h-[38px] rounded-md">
        <Link href="/">Voltar para o catálogo</Link>
      </Button>
    </main>
  );
}
