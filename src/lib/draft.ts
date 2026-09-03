import type { VehicleDraft } from "@/app/admin/actions";
import type { VehicleKind } from "@/db/schema";
import { FUELS, TRANSMISSIONS } from "./vehicle-kind";
import type { Vehicle } from "./vehicle";

export function blankDraft(kind: VehicleKind = "carro"): VehicleDraft {
  const year = new Date().getFullYear();
  return {
    id: null,
    kind,
    brand: "",
    model: "",
    version: "",
    yearFab: year,
    year,
    price: 0,
    mileage: 0,
    transmission: TRANSMISSIONS[kind][0],
    fuel: FUELS[kind][0],
    color: "",
    doors: kind === "carro" ? 4 : 0,
    engine: "",
    plateEnd: "",
    displacement: 0,
    gears: kind === "moto" ? 5 : 0,
    startType: kind === "moto" ? "Elétrica e pedal" : "",
    brakes: "",
    cooling: "",
    ipvaPaid: true,
    oneOwner: false,
    inspection: false,
    status: "novo",
    features: [],
    tags: [],
    description: "",
    photos: [],
  };
}

/**
 * Troca o tipo do anuncio preservando tudo que os dois tipos tem em comum.
 * Cambio e combustivel sao redefinidos quando o valor atual nao existe no
 * tipo novo — "Diesel" nao e opcao de moto.
 */
export function draftWithKind(draft: VehicleDraft, kind: VehicleKind): VehicleDraft {
  const fresh = blankDraft(kind);
  return {
    ...draft,
    kind,
    transmission: TRANSMISSIONS[kind].includes(draft.transmission)
      ? draft.transmission
      : fresh.transmission,
    fuel: FUELS[kind].includes(draft.fuel) ? draft.fuel : fresh.fuel,
    // Opcionais sao listas diferentes; manter os do carro numa moto so gera
    // "Teto solar" em anuncio de Fazer.
    features: [],
    doors: kind === "carro" ? draft.doors || fresh.doors : 0,
    gears: kind === "moto" ? draft.gears || fresh.gears : 0,
    startType: kind === "moto" ? draft.startType || fresh.startType : "",
  };
}

export function draftFromVehicle(vehicle: Vehicle): VehicleDraft {
  return {
    id: vehicle.id,
    kind: vehicle.kind,
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version,
    yearFab: vehicle.yearFab,
    year: vehicle.year,
    price: vehicle.price,
    mileage: vehicle.mileage,
    transmission: vehicle.transmission,
    fuel: vehicle.fuel,
    color: vehicle.color,
    doors: vehicle.doors,
    engine: vehicle.engine,
    plateEnd: vehicle.plateEnd,
    displacement: vehicle.displacement,
    gears: vehicle.gears,
    startType: vehicle.startType,
    brakes: vehicle.brakes,
    cooling: vehicle.cooling,
    ipvaPaid: vehicle.ipvaPaid,
    oneOwner: vehicle.oneOwner,
    inspection: vehicle.inspection,
    status: vehicle.status,
    features: [...vehicle.features],
    tags: [...vehicle.tags],
    description: vehicle.description,
    photos: vehicle.photos.map((photo) => ({ ...photo })),
  };
}
