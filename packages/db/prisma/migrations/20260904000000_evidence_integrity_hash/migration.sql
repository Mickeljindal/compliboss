-- Evidence integrity: tamper-evidence content hash on automated check results.
ALTER TABLE "IntegrationCheckResult" ADD COLUMN "contentHash" TEXT;
