import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";

@Controller()
export class HomeController {
  @Get()
  getHomePage(@Res() res: Response) {
    res.redirect(process.env.EXPEDIENT_HOMEPAGE_URL);
  }
}
