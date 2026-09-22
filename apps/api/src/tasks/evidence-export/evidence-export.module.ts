import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { TasksModule } from '../tasks.module';
import { EvidenceExportService } from './evidence-export.service';
import { FrameworkEvidencePackageService } from './framework-evidence-package.service';
import {
  EvidenceExportController,
  AuditorEvidenceExportController,
} from './evidence-export.controller';

@Module({
  imports: [AuthModule, forwardRef(() => TasksModule)],
  controllers: [EvidenceExportController, AuditorEvidenceExportController],
  providers: [EvidenceExportService, FrameworkEvidencePackageService],
  exports: [EvidenceExportService, FrameworkEvidencePackageService],
})
export class EvidenceExportModule {}
