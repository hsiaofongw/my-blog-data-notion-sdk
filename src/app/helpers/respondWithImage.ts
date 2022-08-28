import { HttpStatus } from "@nestjs/common";
import { Response } from "express";

export async function respondWithImage(image: Buffer, res: Response) {
  res.status(HttpStatus.OK);
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "no-cache");
  res.write(image);
  res.end();
}
