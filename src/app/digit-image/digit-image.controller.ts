import { Controller, Get, HttpStatus, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { DigitImageGenerateService } from "../digit-image-generate/digit-image-generate.service";
import { respondWithImage } from "../helpers/respondWithImage";

@Controller("digit-image")
export class DigitImageController {
  constructor(private digitImageGenerateService: DigitImageGenerateService) {}

  @Get(":num")
  async getDigitImage(@Param("num") num: string, @Res() res: Response) {
    const imageBuffer = await this.digitImageGenerateService.getDigitImage(num);
    respondWithImage(imageBuffer, res);
  }
}
