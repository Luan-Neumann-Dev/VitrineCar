"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteVehicleAction,
  duplicateVehicleAction,
  moveVehicleAction,
  saveVehicleAction,
  setStatusAction,
  type ActionResult,
  type VehicleDraft,
} from "@/app/admin/actions";
import { AdEditor } from "@/components/admin/ad-editor";
import { AdRow } from "@/components/admin/ad-row";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { VehicleStatus } from "@/db/schema";
import { blankDraft, draftFromVehicle } from "@/lib/draft";
import { plural } from "@/lib/format";
import { fullTitle, type Vehicle } from "@/lib/vehicle";

/** "new" enquanto o anúncio ainda não existe no banco; o id, depois disso. */
type Editing = number | "new" | null;

export function AdminPanel({ vehicles }: { vehicles: Vehicle[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState<VehicleDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Vehicle | null>(null);

  /**
   * Toda mutação passa por aqui: mostra o erro, avisa do sucesso e recarrega
   * os dados do servidor. O painel não mantém cópia local do catálogo — a
   * fonte da verdade é o D1, e `refresh()` traz o estado real de volta.
   */
  const run = (action: () => Promise<ActionResult>, onSuccess?: () => void) =>
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        if (result.message) toast.success(result.message);
        onSuccess?.();
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Não consegui salvar. Tente de novo.",
        );
      }
    });

  const closeEditor = () => {
    setEditing(null);
    setDraft(null);
  };

  const counts = vehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {});

  const summary = [
    `${counts.novo ?? 0} novos`,
    `${counts.disponivel ?? 0} disponíveis`,
    `${counts.reservado ?? 0} reservados`,
    `${counts.vendido ?? 0} vendidos`,
  ].join(" · ");

  const editor = draft && (
    <AdEditor
      draft={draft}
      pending={pending}
      onChange={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
      onSave={() => run(() => saveVehicleAction(draft), closeEditor)}
      onCancel={closeEditor}
    />
  );

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 pt-6.5 pb-24">
      <div className="flex flex-col gap-5.5">
        <div className="flex flex-wrap items-end justify-between gap-3.5">
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] font-semibold tracking-tight">Meus anúncios</h1>
            <p className="text-[13.5px] text-muted-foreground">
              {plural(vehicles.length, "anúncio", "anúncios")} · {summary}
            </p>
          </div>
          <Button
            disabled={pending || editing === "new"}
            onClick={() => {
              setEditing("new");
              setDraft(blankDraft());
            }}
            className="h-[38px] rounded-md"
          >
            <Plus className="size-[15px] stroke-2" />
            Novo anúncio
          </Button>
        </div>

        {editing === "new" && editor}

        <div className="flex flex-col gap-2.5">
          {vehicles.map((vehicle, index) => (
            <div
              key={vehicle.id}
              className="flex flex-col overflow-hidden rounded-lg border bg-card"
            >
              <AdRow
                vehicle={vehicle}
                position={index + 1}
                canMoveUp={index > 0}
                canMoveDown={index < vehicles.length - 1}
                disabled={pending}
                onMove={(direction) => run(() => moveVehicleAction(vehicle.id, direction))}
                onStatus={(status: VehicleStatus) =>
                  run(() => setStatusAction(vehicle.id, status))
                }
                onEdit={() => {
                  setEditing(vehicle.id);
                  setDraft(draftFromVehicle(vehicle));
                }}
                onDuplicate={() => run(() => duplicateVehicleAction(vehicle.id))}
                onDelete={() => setConfirmDelete(vehicle)}
              />
              {editing === vehicle.id && <div className="px-3.5 pb-3.5">{editor}</div>}
            </div>
          ))}

          {vehicles.length === 0 && (
            <p className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
              Nenhum anúncio ainda. Clique em “Novo anúncio” para publicar o primeiro.
            </p>
          )}
        </div>
      </div>

      <AlertDialog
        open={confirmDelete != null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete && fullTitle(confirmDelete)} sai da vitrine na hora, junto
              com as fotos. Não tem como desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = confirmDelete;
                setConfirmDelete(null);
                if (target) run(() => deleteVehicleAction(target.id), closeEditor);
              }}
            >
              Excluir anúncio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
