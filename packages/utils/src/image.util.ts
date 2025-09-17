import { $ } from "bun";
import Jimp from "jimp";

const MAX_DIMENSION = 1000;

export async function cleanImage(input: Jimp) {
  console.log("Cleaning image...");
  const j = await Jimp.read(input);

  // trim transparent pixels
  let oldWidth = j.bitmap.width;
  let oldHeight = j.bitmap.height;
  j.autocrop();
  console.log(
    `Trimmed ${oldWidth}x${oldHeight} to ${j.bitmap.width}x${j.bitmap.height}`
  );

  // max 1000px on the longest side
  oldWidth = j.bitmap.width;
  oldHeight = j.bitmap.height;
  if (j.bitmap.width > MAX_DIMENSION || j.bitmap.height > MAX_DIMENSION) {
    j.scaleToFit(MAX_DIMENSION, MAX_DIMENSION);
  }
  console.log(
    `Scaled ${oldWidth}x${oldHeight} to ${j.bitmap.width}x${j.bitmap.height}`
  );

  return j.getBufferAsync(Jimp.MIME_PNG);
}

export async function tinyPng(input: Buffer) {
  console.log("Compressing image...");
  //   const compressor = new PngQuant(["256", "--speed", "1"]);

  const buffer = await $`pngquant 256 --speed 1 - < ${input}`.arrayBuffer();
  console.log(`Compressed from ${input.byteLength} to ${buffer.byteLength}`);
  return Buffer.from(buffer);
}

async function processJimp(input: Jimp) {
  const png = await cleanImage(input);
  const compressed = await tinyPng(png);
  return compressed;
}

export async function processFromBuffer(input: Buffer) {
  return processJimp(await Jimp.read(input));
}

export async function processFromUrl(url: string) {
  return processJimp(await Jimp.read(url));
}
