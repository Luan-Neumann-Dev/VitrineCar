import type { VehicleDraft } from "@/app/admin/actions";
import type { Vehicle } from "./vehicle";

/** Opcionais sugeridos no editor; o vendedor marca os que o carro tem. */
export const FEATURE_SUGGESTIONS = [
  "Ar-condicionado",
  "Ar-condicionado digital",
  "Direção elétrica",
  "Multimídia",
  "Câmera de ré",
  "Sensor de estacionamento",
  "Piloto automático",
  "Bancos em couro",
  "Faróis de LED",
  "Teto solar",
  "Rodas de liga",
  "Vidros elétricos",
  "Tração 4x4",
  "Painel digital",
  "Chave presencial",
];

export function blankDraft(): VehicleDraft {
  const year = new Date().getFullYear();
  return {
    id: null,
    brand: "",
    model: "",
    version: "",
    yearFab: year,
    year,
    price: 0,
    mileage: 0,
    transmission: "Automático",
    fuel: "Flex",
    color: "",
    doors: 4,
    engine: "",
    plateEnd: "",
    ipvaPaid: true,
    oneOwner: false,
    inspection: false,
    status: "novo",
    features: [],
    description: "",
    photos: [],
  };
}

export function draftFromVehicle(vehicle: Vehicle): VehicleDraft {
  return {
    id: vehicle.id,
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
    ipvaPaid: vehicle.ipvaPaid,
    oneOwner: vehicle.oneOwner,
    inspection: vehicle.inspection,
    status: vehicle.status,
    features: [...vehicle.features],
    description: vehicle.description,
    photos: vehicle.photos.map((photo) => ({ ...photo })),
  };
}
