"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { loginAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(loginAction, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <main className="flex items-center justify-center px-5 pt-18 pb-24">
      <form
        action={action}
        className="flex w-full max-w-[380px] flex-col gap-4.5 rounded-lg border bg-card p-6.5 shadow-xs"
      >
        <span className="flex size-[38px] items-center justify-center rounded-lg bg-muted">
          <Lock className="size-4.5 stroke-[1.75]" aria-hidden="true" />
        </span>

        <div className="flex flex-col gap-1">
          <h1 className="text-[19px] font-semibold tracking-tight">
            Área do vendedor
          </h1>
          <p className="text-[13.5px] leading-normal text-muted-foreground">
            Entre para publicar, editar e dar baixa nos anúncios da vitrine.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-[13px]">
            Senha
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-10 rounded-md"
          />
        </div>

        {state && !state.ok && (
          <p role="alert" className="text-[12.5px] text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="h-10.5 rounded-md">
          {pending ? "Entrando…" : "Entrar no painel"}
        </Button>

        <div className="h-px bg-border" />

        <p className="text-xs leading-normal text-muted-foreground">
          Depois de dez tentativas erradas o acesso trava por 15 minutos.
        </p>

        <Link
          href="/"
          className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Voltar para a vitrine
        </Link>
      </form>
    </main>
  );
}
