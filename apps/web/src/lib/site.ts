/** Shared site config: navigation, frameworks, integrations, pricing. */

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Platform', href: '/platform' },
  { label: 'Frameworks', href: '/frameworks' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Trust', href: '/trust' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Company', href: '/company' },
];

export interface Framework {
  slug: string;
  name: string;
  short: string;
  tagline: string;
  summary: string;
  whoNeedsIt: string;
  timeline: string;
  highlights: string[];
}

export const FRAMEWORKS: Framework[] = [
  {
    slug: 'soc-2',
    name: 'SOC 2',
    short: 'SOC 2',
    tagline: 'The report enterprise buyers ask for first.',
    summary:
      'SOC 2 evaluates how you manage customer data across the Trust Services Criteria — security, availability, processing integrity, confidentiality and privacy. CompliBoss maps every criterion to controls, collects the evidence automatically, and keeps you audit-ready year round.',
    whoNeedsIt:
      'B2B SaaS and tech companies selling to mid-market and enterprise, where security review blocks the deal.',
    timeline: 'Type I in weeks; Type II over your chosen observation window.',
    highlights: [
      'Every Trust Services Criterion mapped to controls and evidence',
      'Continuous checks across AWS, Azure, GCP, GitHub and identity',
      'Auditor evidence package + branded PDF binder, on demand',
      'Tamper-evident, timestamped evidence with an integrity check',
    ],
  },
  {
    slug: 'iso-27001',
    name: 'ISO 27001',
    short: 'ISO 27001',
    tagline: 'The global standard for an information security program.',
    summary:
      'ISO 27001 certifies a full Information Security Management System (ISMS) against Annex A controls. CompliBoss builds the ISMS with you — policies, risk treatment, and Annex A control coverage — and reuses your existing evidence so you are not starting from scratch.',
    whoNeedsIt:
      'Companies selling internationally, or where customers and partners expect ISO certification.',
    timeline: 'Certification-ready in weeks; supports Stage 1 and Stage 2 audits.',
    highlights: [
      'Full Annex A control library mapped to your systems',
      'Risk register and treatment plan built in',
      'Statement of Applicability generated from your controls',
      'One evidence base shared with SOC 2 and other frameworks',
    ],
  },
  {
    slug: 'hipaa',
    name: 'HIPAA',
    short: 'HIPAA',
    tagline: 'Protect PHI and prove it.',
    summary:
      'HIPAA governs how healthcare data (PHI) is safeguarded across administrative, physical and technical safeguards. CompliBoss maps the Security and Privacy Rules to controls, tracks workforce training and BAAs, and keeps evidence current.',
    whoNeedsIt:
      'Health-tech, digital health, and any company handling protected health information.',
    timeline: 'Readiness in weeks; continuous monitoring after.',
    highlights: [
      'Security and Privacy Rule safeguards mapped to controls',
      'Workforce security training and attestations tracked',
      'Vendor / Business Associate risk management',
      'Continuous evidence with a full audit trail',
    ],
  },
  {
    slug: 'gdpr',
    name: 'GDPR',
    short: 'GDPR',
    tagline: 'Handle EU personal data the right way.',
    summary:
      'GDPR sets the bar for processing EU residents’ personal data. CompliBoss operationalizes the principles — records of processing, data subject rights, DPIAs and processor management — into tracked controls with evidence.',
    whoNeedsIt:
      'Any company with EU users or customers, regardless of where you are based.',
    timeline: 'Program stood up in weeks; maintained continuously.',
    highlights: [
      'Records of processing and lawful-basis tracking',
      'Data subject request and DPIA workflows',
      'Sub-processor and vendor management',
      'Evidence mapped to GDPR articles',
    ],
  },
];

export const NATIVE_INTEGRATIONS: { name: string; note: string }[] = [
  { name: 'Amazon Web Services', note: '~46 service checks — S3, IAM, KMS, RDS, GuardDuty and more' },
  { name: 'Microsoft Azure', note: 'Defender for Cloud + 12 service checks' },
  { name: 'Google Cloud', note: 'Security Command Center findings mapped to controls' },
  { name: 'GitHub', note: 'Branch protection, code scanning, Dependabot, 2FA' },
  { name: 'Google Workspace', note: 'User directory sync + MFA / access checks' },
  { name: 'JumpCloud', note: 'People and device inventory sync' },
];

export interface PricingTier {
  name: string;
  blurb: string;
  points: string[];
  featured?: boolean;
}

export const PRICING: PricingTier[] = [
  {
    name: 'Starter',
    blurb: 'Your first framework, fast.',
    points: ['1 framework (e.g. SOC 2)', 'Automated evidence from your cloud', 'Policies + Trust Center', 'Email support'],
  },
  {
    name: 'Growth',
    blurb: 'Multiple frameworks, one evidence base.',
    points: ['Multiple frameworks', 'All integrations', 'Auditor evidence package + PDF', 'Priority support & onboarding'],
    featured: true,
  },
  {
    name: 'Enterprise',
    blurb: 'Self-hosted and scaled.',
    points: ['Self-hosted deployment option', 'Custom frameworks', 'SSO + advanced RBAC', 'Dedicated support & SLA'],
  },
];
