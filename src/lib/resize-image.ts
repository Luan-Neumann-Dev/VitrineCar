import { VARIANT_WIDTH } from "./photos";

export type PreparedPhoto = {
  label: string;
  width: number;
  height: number;
  full: Blob;
  thumb: Blob;
};

async function toWebp(bitmap: ImageBitmap, maxWidth: number) {
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82),
  );
  if (!blob) throw new Error("Não consegui converter a imagem.");
  return { blob, width, height };
}

/**
 * Prepara uma foto no navegador antes de subir.
 *
 * Foto de celular tem 4–8 MB e 4000px de largura — muito mais do que a vitrine
 * usa. Reduzir aqui deixa o upload rapido no 4G do patio e o bucket enxuto.
 * Saem dois tamanhos: o grande para galeria e lightbox, o pequeno para os
 * cards e as miniaturas.
 */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(file);
  try {
    const full = await toWebp(bitmap, VARIANT_WIDTH.full);
    const thumb = await toWebp(bitmap, VARIANT_WIDTH.thumb);
    return {
      label: (file.name || "Foto").replace(/\.[^.]+$/, "").slice(0, 22) || "Foto",
      width: full.width,
      height: full.height,
      full: full.blob,
      thumb: thumb.blob,
    };
  } finally {
    bitmap.close();
  }
}
