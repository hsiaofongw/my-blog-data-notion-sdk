import { Test, TestingModule } from '@nestjs/testing';
import { DigitImageGenerateService } from './digit-image-generate.service';

describe('DigitImageGenerateService', () => {
  let service: DigitImageGenerateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DigitImageGenerateService],
    }).compile();

    service = module.get<DigitImageGenerateService>(DigitImageGenerateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
