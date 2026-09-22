import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTOs for the auditor evidence-export PACKAGE (control-by-control).
 *
 * This complements the existing per-task PDF/ZIP export: it assembles, per
 * framework instance, a control-by-control view of the evidence backing each
 * requirement — the mapped requirement identifiers (e.g. SOC 2 CC6.1), the
 * tasks that operationalize each control, the latest automated check results
 * (with raw collection timestamps), linked policies, and uploaded files. It is
 * the mapped artifact an auditor works from.
 */

export class ResultRefDto {
  @ApiProperty() passed!: boolean;
  @ApiProperty() resourceType!: string;
  @ApiProperty() resourceId!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ nullable: true }) severity!: string | null;
  @ApiProperty({ description: 'When this evidence was collected from the source system' })
  collectedAt!: string;
}

export class CheckSummaryDto {
  @ApiProperty() checkName!: string;
  @ApiProperty({ description: 'success | failed | pending | running | inconclusive' })
  status!: string;
  @ApiPropertyOptional({ nullable: true }) completedAt!: string | null;
  @ApiProperty() totalChecked!: number;
  @ApiProperty() passedCount!: number;
  @ApiProperty() failedCount!: number;
  @ApiPropertyOptional({ nullable: true, description: 'Most recent collectedAt across this run' })
  newestCollectedAt!: string | null;
  @ApiProperty({ type: [ResultRefDto], description: 'A capped sample of per-resource results' })
  sampleResults!: ResultRefDto[];
}

export class AttachmentRefDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) type!: string | null;
  @ApiProperty() createdAt!: string;
}

export class TaskEvidenceDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ description: 'todo | in_progress | in_review | done | not_relevant | failed' })
  status!: string;
  @ApiPropertyOptional({ nullable: true }) frequency!: string | null;
  @ApiProperty({ description: 'AUTOMATED | MANUAL' }) automationStatus!: string;
  @ApiPropertyOptional({ nullable: true }) lastCompletedAt!: string | null;
  @ApiPropertyOptional({ type: CheckSummaryDto, nullable: true })
  latestCheck!: CheckSummaryDto | null;
  @ApiProperty() attachmentCount!: number;
  @ApiProperty({ type: [AttachmentRefDto] }) attachments!: AttachmentRefDto[];
}

export class PolicyRefDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ description: 'draft | published | needs_review | ...' }) status!: string;
  @ApiPropertyOptional({ nullable: true }) lastPublishedAt!: string | null;
}

export class RequirementRefDto {
  @ApiProperty({ description: 'Canonical requirement identifier, e.g. "CC6.1" or "A.8.1"' })
  identifier!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiPropertyOptional({ nullable: true }) family!: string | null;
  @ApiProperty({ description: 'framework | custom' }) source!: string;
}

export class ControlEvidenceDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty({ description: 'How well this control is currently evidenced: satisfied | partial | gap' })
  coverage!: string;
  @ApiProperty({ type: [RequirementRefDto] }) requirements!: RequirementRefDto[];
  @ApiProperty({ type: [TaskEvidenceDto] }) tasks!: TaskEvidenceDto[];
  @ApiProperty({ type: [PolicyRefDto] }) policies!: PolicyRefDto[];
}

export class EvidenceSummaryDto {
  @ApiProperty() controlCount!: number;
  @ApiProperty() requirementCount!: number;
  @ApiProperty() taskCount!: number;
  @ApiProperty() tasksDone!: number;
  @ApiProperty() tasksNotRelevant!: number;
  @ApiProperty() automatedTasks!: number;
  @ApiProperty() policyCount!: number;
  @ApiProperty() policiesPublished!: number;
  @ApiProperty({ description: 'Percent of in-scope (non not_relevant) tasks marked done' })
  readinessPercent!: number;
  @ApiProperty() controlsSatisfied!: number;
  @ApiProperty() controlsPartial!: number;
  @ApiProperty() controlsGap!: number;
  @ApiPropertyOptional({ nullable: true }) evidenceOldestCollectedAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) evidenceNewestCollectedAt!: string | null;
}

export class FrameworkRefDto {
  @ApiProperty() frameworkInstanceId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ description: 'platform | custom' }) type!: string;
}

export class EvidencePackageDto {
  @ApiProperty({ type: FrameworkRefDto }) framework!: FrameworkRefDto;
  @ApiProperty({ description: 'ISO timestamp this package was generated' })
  generatedAt!: string;
  @ApiProperty({ type: EvidenceSummaryDto }) summary!: EvidenceSummaryDto;
  @ApiProperty({ type: [ControlEvidenceDto] }) controls!: ControlEvidenceDto[];
}

export class FrameworkListItemDto {
  @ApiProperty() frameworkInstanceId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ description: 'platform | custom' }) type!: string;
  @ApiProperty() controlCount!: number;
  @ApiProperty() readinessPercent!: number;
}
