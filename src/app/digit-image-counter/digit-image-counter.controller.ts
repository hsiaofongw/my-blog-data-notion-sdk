import { Controller, Get, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { DigitImageGenerateService } from "../digit-image-generate/digit-image-generate.service";
import { respondWithImage } from "../helpers/respondWithImage";
import { RedisCacheService } from "../redis-cache/redis-cache.service";

@Controller("digit-image-counter")
export class DigitImageCounterController {
  constructor(
    private cache: RedisCacheService,
    private digitImageService: DigitImageGenerateService
  ) {}

  @Get(":counterName")
  async getCounterImage(
    @Param("counterName") counterName: string,
    @Res() res: Response
  ) {
    const valueObject = await this.cache.getString(counterName);
    if (valueObject) {
      const count = parseInt(valueObject);
      setTimeout(() => {
        this.cache.setString(counterName, String(count + 1));
      }, 0);

      const image = await this.digitImageService.getDigitImage(String(count));
      respondWithImage(image, res);
      return;
    }

    setTimeout(() => {
      this.cache.setString(counterName, "0");
    }, 0);

    const image = await this.digitImageService.getDigitImage('0');
    respondWithImage(image, res);
  }
}
