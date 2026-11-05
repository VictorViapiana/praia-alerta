import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { fromByteArray, toByteArray } from "base64-js";
import jpeg from "jpeg-js";
import UPNG from "upng-js";

const FRAME_MODULE = require("../assets/frames/eu-amo-guarapari.png");

function coverSource(srcW: number, srcH: number, dstRatio: number) {
  const srcRatio = srcW / srcH;
  if (srcRatio > dstRatio) {
    const sw = srcH * dstRatio;
    return { sx: Math.floor((srcW - sw) / 2), sy: 0, sw: Math.floor(sw), sh: srcH };
  }
  const sh = srcW / dstRatio;
  return { sx: 0, sy: Math.floor((srcH - sh) / 2), sw: srcW, sh: Math.floor(sh) };
}

/**
 * Compõe a foto da câmera com a moldura PNG (mesmo algoritmo do web TouristCamera).
 * Retorna URI file:// do JPEG final.
 */
export async function composeFramedPhoto(
  photoUri: string,
  opts?: { maxSide?: number },
): Promise<string> {
  const maxSide = opts?.maxSide ?? 1600;

  const frameAsset = Asset.fromModule(FRAME_MODULE);
  await frameAsset.downloadAsync();
  const frameUri = frameAsset.localUri ?? frameAsset.uri;
  if (!frameUri) throw new Error("frame missing");

  const [photoB64, frameB64] = await Promise.all([
    FileSystem.readAsStringAsync(photoUri, { encoding: FileSystem.EncodingType.Base64 }),
    FileSystem.readAsStringAsync(frameUri, { encoding: FileSystem.EncodingType.Base64 }),
  ]);

  const photo = jpeg.decode(toByteArray(photoB64), { useTArray: true, formatAsRGBA: true });
  const frameBytes = toByteArray(frameB64);
  const frameAb = frameBytes.buffer.slice(
    frameBytes.byteOffset,
    frameBytes.byteOffset + frameBytes.byteLength,
  );
  const frameDecoded = UPNG.decode(frameAb as ArrayBuffer);
  const frameRgba = new Uint8Array(UPNG.toRGBA8(frameDecoded)[0]);
  const fw = frameDecoded.width;
  const fh = frameDecoded.height;
  const ratio = fw / fh;

  const canvasH = ratio > 1 ? Math.round(maxSide / ratio) : maxSide;
  const canvasW = Math.round(canvasH * ratio);
  const out = new Uint8ClampedArray(canvasW * canvasH * 4);

  const crop = coverSource(photo.width, photo.height, ratio);
  const photoData = photo.data as Uint8Array;

  for (let y = 0; y < canvasH; y++) {
    const srcY = Math.min(
      photo.height - 1,
      Math.floor(crop.sy + ((y + 0.5) / canvasH) * crop.sh),
    );
    for (let x = 0; x < canvasW; x++) {
      const srcX = Math.min(
        photo.width - 1,
        Math.floor(crop.sx + ((x + 0.5) / canvasW) * crop.sw),
      );
      const si = (srcY * photo.width + srcX) * 4;
      const oi = (y * canvasW + x) * 4;
      out[oi] = photoData[si];
      out[oi + 1] = photoData[si + 1];
      out[oi + 2] = photoData[si + 2];
      out[oi + 3] = 255;
    }
  }

  for (let y = 0; y < canvasH; y++) {
    const fy = Math.min(fh - 1, Math.floor(((y + 0.5) / canvasH) * fh));
    for (let x = 0; x < canvasW; x++) {
      const fx = Math.min(fw - 1, Math.floor(((x + 0.5) / canvasW) * fw));
      const fi = (fy * fw + fx) * 4;
      const fa = frameRgba[fi + 3];
      if (fa === 0) continue;
      const oi = (y * canvasW + x) * 4;
      const a = fa / 255;
      const ia = 1 - a;
      out[oi] = Math.round(frameRgba[fi] * a + out[oi] * ia);
      out[oi + 1] = Math.round(frameRgba[fi + 1] * a + out[oi + 1] * ia);
      out[oi + 2] = Math.round(frameRgba[fi + 2] * a + out[oi + 2] * ia);
    }
  }

  const encoded = jpeg.encode({ data: out, width: canvasW, height: canvasH }, 90);
  const outPath = `${FileSystem.cacheDirectory}eu-amo-guarapari-${Date.now()}.jpg`;
  await FileSystem.writeAsStringAsync(outPath, fromByteArray(encoded.data), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return outPath;
}
