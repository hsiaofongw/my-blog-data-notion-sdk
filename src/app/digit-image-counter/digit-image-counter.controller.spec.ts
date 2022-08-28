import { Test, TestingModule } from '@nestjs/testing';
import { DigitImageCounterController } from './digit-image-counter.controller';

describe('DigitImageCounterController', () => {
  let controller: DigitImageCounterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DigitImageCounterController],
    }).compile();

    controller = module.get<DigitImageCounterController>(DigitImageCounterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
