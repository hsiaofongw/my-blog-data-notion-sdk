import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { digitImages } from '../digit-image/digitImages';

@Injectable()
export class DigitImageGenerateService {
  private readonly numDigitSet = new Set<string>([
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ]);

  async getDigitImage(num: string) {


    let image: Array<Array<number>> = [];
    for (const c of num) {
      if (this.numDigitSet.has(c)) {
        const digit = parseInt(c);
        const digitImage = digitImages[digit];
        const nRows = digitImage.length;
        const nCols = digitImage[0].length;
        for (let j = 0; j < nCols; j++) {
          let col: Array<number> = [];
          for (let i = 0; i < nRows; i++) {
            col.push(digitImage[i][j]);
          }
          image.push(col);
        }
      }
    }

    let imageRotated: Array<Array<number>> = [];
    const nRows = image.length;
    const nCols = image[0].length;
    for (let j = 0; j < nCols; j++) {
      let row: Array<number> = [];
      for (let i = 0; i < nRows; i++) {
        row.push(image[i][j]);
      }
      imageRotated.push(row);
    }

    const width = nRows;
    const height = nCols;
    let flattenArray: Array<number> = [];
    for (let row of imageRotated) {
      for (let pixelValue of row) {
        flattenArray.push(pixelValue);
      }
    }
    const typedImage = Uint8Array.from(flattenArray);
    const imageBinary = sharp(typedImage, {
      raw: {
        width,
        height,
        channels: 1,
      },
    });

    const imageBuffer = await imageBinary.png().toBuffer();
    return imageBuffer;
  }
}
