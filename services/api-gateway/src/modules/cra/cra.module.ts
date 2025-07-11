import { Module, forwardRef } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { EdcModule } from '../edc/edc.module';
import { CraController } from './controllers/cra.controller';
import { CraService } from './services/cra.service';

@Module({
  imports: [forwardRef(() => AIModule), forwardRef(() => EdcModule)],
  controllers: [CraController],
  providers: [CraService],
  exports: [CraService],
})
export class CraModule {}
