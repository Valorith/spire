import { convertDDS2Jimp } from 'sage-core/util/image-processing';
import 'jimp/browser/lib/jimp';

export const ShaderType = {
  Diffuse                        : 0,
  Transparent25                  : 1,
  Transparent50                  : 2,
  Transparent75                  : 3,
  TransparentAdditive            : 4,
  TransparentAdditiveUnlit       : 5,
  TransparentMasked              : 6,
  DiffuseSkydome                 : 7,
  TransparentSkydome             : 8,
  TransparentAdditiveUnlitSkydome: 9,
  Invisible                      : 10,
  Boundary                       : 11,
};

const fullAlphaToDoubleAlphaThreshold = 64;
const alphaShaderMap = {
  [ShaderType.Transparent25]           : 64,
  [ShaderType.Transparent50]           : 128,
  [ShaderType.TransparentSkydome]      : 128,
  [ShaderType.Transparent75]           : 192,
  [ShaderType.TransparentAdditive]     : 192,
  [ShaderType.TransparentAdditiveUnlit]: 192,
};

export const normalizeTextureName = (name) =>
  name.toLowerCase().replace(/\.\w+$/, '.png');

export async function parseTexture(name, shaderType, data) {
  name = name.toLowerCase().replace(/\.\w+$/, '');
  // The browser build registers Jimp on the global object. Resolve it at call
  // time rather than capturing it during module initialization so dynamic
  // chunk ordering cannot permanently cache an undefined decoder.
  const Jimp = globalThis.Jimp; // eslint-disable-line
  if (!Jimp?.read || !Jimp?.MIME_PNG) {
    throw new Error('Browser texture decoder did not initialize');
  }

  if (new DataView(data).getUint16(0, true) === 0x4d42) {
    try {
      const img = await Jimp.read(data);
      let maskColor;

      if (shaderType === ShaderType.TransparentMasked) {
        const firstPixelIdx = 0;
        maskColor = {
          r: img.bitmap.data[firstPixelIdx],
          g: img.bitmap.data[firstPixelIdx + 1],
          b: img.bitmap.data[firstPixelIdx + 2],
          a: img.bitmap.data[firstPixelIdx + 3],
        };
      }

      img.scan(0, 0, img.bitmap.width, img.bitmap.height, (_x, _y, idx) => {
        const r = img.bitmap.data[idx];
        const g = img.bitmap.data[idx + 1];
        const b = img.bitmap.data[idx + 2];
        let alpha = img.bitmap.data[idx + 3];

        if (shaderType === ShaderType.TransparentMasked) {
          if (
            r === maskColor.r &&
            g === maskColor.g &&
            b === maskColor.b &&
            alpha === maskColor.a
          ) {
            alpha = 0;
          }
        } else if (alphaShaderMap[shaderType]) {
          alpha = alphaShaderMap[shaderType];
        } else if (
          shaderType === undefined ||
          shaderType === ShaderType.Diffuse
        ) {
          alpha = 255;
        } else {
          const maxRgb = Math.max(r, g, b);
          alpha =
            maxRgb <= fullAlphaToDoubleAlphaThreshold
              ? maxRgb
              : Math.min(
                  maxRgb + (maxRgb - fullAlphaToDoubleAlphaThreshold) * 2,
                  255
                );
        }

        img.bitmap.data[idx + 3] = alpha;
      });

      return await img.getBufferAsync(Jimp.MIME_PNG);
    } catch (e) {
      console.warn('Error processing BMP:', e, name);
      return null;
    }
  }

  let decompressed;
  let dds;
  try {
    [decompressed, dds] = convertDDS2Jimp(new Uint8Array(data), name);
  } catch (e) {
    console.log('Error decompressing DDS', e);
    return null;
  }

  const w = dds.mipmaps[0].width;
  const h = dds.mipmaps[0].height;
  const bmp = new Jimp(w, h);

  let maskColor;
  if (shaderType === ShaderType.TransparentMasked) {
    maskColor = {
      r: decompressed[0],
      g: decompressed[1],
      b: decompressed[2],
      a: decompressed[3],
    };
  }

  bmp.scan(0, 0, w, h, (_x, _y, idx) => {
    bmp.bitmap.data[idx] = decompressed[idx];
    bmp.bitmap.data[idx + 1] = decompressed[idx + 1];
    bmp.bitmap.data[idx + 2] = decompressed[idx + 2];
    let alpha = decompressed[idx + 3];

    if (shaderType === ShaderType.TransparentMasked) {
      if (
        bmp.bitmap.data[idx] === maskColor.r &&
        bmp.bitmap.data[idx + 1] === maskColor.g &&
        bmp.bitmap.data[idx + 2] === maskColor.b &&
        alpha === maskColor.a
      ) {
        alpha = 0;
      }
    } else if (alphaShaderMap[shaderType]) {
      alpha = alphaShaderMap[shaderType];
    }

    bmp.bitmap.data[idx + 3] = alpha;
  });

  bmp.flip(false, true);
  return await bmp.getBufferAsync(Jimp.MIME_PNG);
}
