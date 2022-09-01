import { Test, TestingModule } from '@nestjs/testing';
import { NotionDatabaseService } from './notion-database.service';

describe('NotionDatabaseService', () => {
  let service: NotionDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotionDatabaseService],
    }).compile();

    service = module.get<NotionDatabaseService>(NotionDatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
