import { Test, TestingModule } from '@nestjs/testing';
import { DigitImageController } from './digit-image.controller';

describe('DigitImageController', () => {
  let controller: DigitImageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DigitImageController],
    }).compile();

    controller = module.get<DigitImageController>(DigitImageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
