// Types for Zustand stores - DevAssist Pro
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  organization?: string
  role: 'admin' | 'user' | 'viewer'
  avatar?: string
  createdAt: Date
  subscription: SubscriptionPlan
}

export interface SubscriptionPlan {
  id: string
  name: 'free' | 'starter' | 'professional' | 'enterprise'
  limits: {
    documentsPerMonth: number
    aiRequestsPerMonth: number
    storageGB: number
    usersCount: number
  }
  features: string[]
  expiresAt?: Date
}

export interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'local'
  model: string
  temperature: number
  maxTokens: number
  costPerToken: number
  description: string
}

export interface AIConfiguration {
  defaultModels: {
    textAnalysis: string
    dataExtraction: string
    reportGeneration: string
    webSearch: string
  }
  moduleOverrides: Record<string, string>
  costLimits: CostConfiguration
  performanceMode: 'quality' | 'balanced' | 'speed'
  providers: {
    openai: ProviderConfig
    anthropic: ProviderConfig
    google: ProviderConfig
  }
}

export interface ProviderConfig {
  apiKey?: string
  enabled: boolean
  models: ModelConfig[]
  rateLimits: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
}

export interface CostConfiguration {
  dailyLimit: number
  monthlyLimit: number
  warningThreshold: number
  currency: 'USD' | 'EUR' | 'RUB'
}

export interface UsageStatistics {
  today: UsageStats
  thisMonth: UsageStats
  total: UsageStats
}

export interface UsageStats {
  requests: number
  tokens: number
  cost: number
  documentsProcessed: number
  analysisCompleted: number
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
  status: 'uploading' | 'processing' | 'success' | 'error'
  url?: string
  metadata?: Record<string, any>
}

export interface AnalysisSession {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'processing' | 'completed' | 'failed'
  tzFile: UploadedFile | null
  kpFiles: UploadedFile[]
  selectedModel: string
  results: AnalysisResult[]
  settings: AnalysisSettings
}

export interface AnalysisSettings {
  includeRiskAssessment: boolean
  includeContractorResearch: boolean
  complianceThreshold: number
  language: 'ru' | 'en'
  reportFormat: 'detailed' | 'summary' | 'executive'
}

export interface AnalysisResult {
  id: string
  fileId: string
  fileName: string
  complianceScore: number
  status: 'processing' | 'completed' | 'failed'
  findings: Finding[]
  summary: string
  risks: Risk[]
  recommendations: string[]
  contractorInfo?: ContractorInfo
  processedAt: Date
  processingTime: number
}

export interface Finding {
  category: string
  score: number
  status: 'compliant' | 'partial' | 'non_compliant'
  details: string[]
  requirements: string[]
  gaps: string[]
}

export interface Risk {
  level: 'low' | 'medium' | 'high' | 'critical'
  category: string
  description: string
  impact: string
  mitigation: string
}

export interface ContractorInfo {
  name: string
  inn?: string
  registrationStatus: 'active' | 'inactive' | 'unknown'
  licenses: string[]
  rating: number
  reviews: number
  financialHealth: 'good' | 'fair' | 'poor' | 'unknown'
  pastProjects: number
  blacklisted: boolean
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
}

export interface SystemStatus {
  ai: {
    openai: 'online' | 'offline' | 'degraded'
    anthropic: 'online' | 'offline' | 'degraded'
    google: 'online' | 'offline' | 'degraded'
  }
  services: {
    api: 'online' | 'offline' | 'degraded'
    database: 'online' | 'offline' | 'degraded'
    fileStorage: 'online' | 'offline' | 'degraded'
    documentProcessor: 'online' | 'offline' | 'degraded'
  }
  lastCheck: Date
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'ru' | 'en'
  timezone: string
  dateFormat: string
  notifications: {
    email: boolean
    browser: boolean
    desktop: boolean
  }
  privacy: {
    analytics: boolean
    errorReporting: boolean
    dataCollection: boolean
  }
}

export interface DashboardStats {
  totalDocuments: number
  totalAnalyses: number
  totalSavings: number
  averageScore: number
  recentActivity: ActivityItem[]
  topModules: ModuleUsage[]
}

export interface ActivityItem {
  id: string
  type: 'analysis' | 'report' | 'upload' | 'login'
  description: string
  timestamp: Date
  moduleId?: string
  status: 'success' | 'failed' | 'in_progress'
}

export interface ModuleUsage {
  moduleId: string
  name: string
  usage: number
  trend: 'up' | 'down' | 'stable'
}

export interface Module {
  id: string
  name: string
  description: string
  icon: string
  status: 'active' | 'beta' | 'coming_soon' | 'disabled'
  version: string
  features: string[]
  permissions: string[]
  route: string
  lastUsed?: Date
  usage: number
}

// =============================================================================
// TZ GENERATOR MODULE TYPES
// =============================================================================

export interface TZTemplate {
  id: string
  name: string
  category: TZCategory
  description: string
  version: string
  createdAt: Date
  updatedAt: Date
  author: string
  isPublic: boolean
  tags: string[]
  sections: TZSection[]
  variables: TZVariable[]
  usageCount: number
  rating: number
}

export interface TZCategory {
  id: string
  name: string
  description: string
  icon: string
  parentId?: string
  subcategories?: TZCategory[]
  templates: TZTemplate[]
}

export interface TZSection {
  id: string
  title: string
  description: string
  content: string
  order: number
  required: boolean
  editable: boolean
  type: 'text' | 'list' | 'table' | 'formula' | 'file' | 'conditional'
  validation?: TZValidation
  dependencies?: string[]
  variables: string[]
}

export interface TZVariable {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'file'
  label: string
  description: string
  required: boolean
  defaultValue?: any
  options?: TZVariableOption[]
  validation?: TZValidation
  category: string
}

export interface TZVariableOption {
  value: any
  label: string
  description?: string
  disabled?: boolean
}

export interface TZValidation {
  min?: number
  max?: number
  pattern?: string
  required?: boolean
  custom?: string
  message?: string
}

export interface TZProject {
  id: string
  name: string
  description: string
  templateId: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived'
  author: string
  collaborators: string[]
  variables: Record<string, any>
  customSections: TZSection[]
  generatedContent: string
  version: number
  tags: string[]
  deadline?: Date
  client?: string
  budget?: number
  notes: string
}

export interface TZGenerationSettings {
  includeTableOfContents: boolean
  includeTimeline: boolean
  includeBudget: boolean
  includeRisks: boolean
  includeAcceptanceCriteria: boolean
  language: 'ru' | 'en'
  format: 'word' | 'pdf' | 'html' | 'markdown'
  style: 'formal' | 'casual' | 'technical'
  aiModel: string
  customPrompts: Record<string, string>
}

// =============================================================================
// PROJECT EVALUATION MODULE TYPES
// =============================================================================

export interface ProjectEvaluation {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'evaluating' | 'completed' | 'archived'
  author: string
  projectData: ProjectData
  criteria: EvaluationCriteria[]
  results: EvaluationResult[]
  finalScore: number
  finalRating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  recommendations: string[]
  risks: ProjectRisk[]
  financialAnalysis: FinancialAnalysis
  marketAnalysis: MarketAnalysis
  technicalAnalysis: TechnicalAnalysis
  legalAnalysis: LegalAnalysis
  reports: EvaluationReport[]
}

export interface ProjectData {
  title: string
  description: string
  type: 'residential' | 'commercial' | 'industrial' | 'infrastructure'
  location: ProjectLocation
  budget: ProjectBudget
  timeline: ProjectTimeline
  scope: ProjectScope
  stakeholders: ProjectStakeholder[]
  documents: UploadedFile[]
  specifications: Record<string, any>
}

export interface ProjectLocation {
  address: string
  city: string
  region: string
  country: string
  coordinates?: {
    lat: number
    lng: number
  }
  zoning: string
  infrastructure: string[]
  accessibility: string
  environmental: string[]
}

export interface ProjectBudget {
  total: number
  currency: 'USD' | 'EUR' | 'RUB'
  breakdown: BudgetItem[]
  contingency: number
  financing: FinancingOption[]
  cashFlow: CashFlowItem[]
}

export interface BudgetItem {
  category: string
  description: string
  amount: number
  percentage: number
  priority: 'high' | 'medium' | 'low'
  risk: 'low' | 'medium' | 'high'
}

export interface FinancingOption {
  type: 'bank_loan' | 'investor' | 'government' | 'self_funded'
  amount: number
  interestRate: number
  term: number
  conditions: string[]
  approved: boolean
}

export interface CashFlowItem {
  month: number
  inflow: number
  outflow: number
  balance: number
  milestone: string
}

export interface ProjectTimeline {
  startDate: Date
  endDate: Date
  phases: ProjectPhase[]
  milestones: Milestone[]
  dependencies: ProjectDependency[]
}

export interface ProjectPhase {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  duration: number
  status: 'planned' | 'in_progress' | 'completed' | 'delayed'
  tasks: ProjectTask[]
  resources: ProjectResource[]
}

export interface ProjectResource {
  id: string
  name: string
  type: 'human' | 'equipment' | 'material' | 'financial'
  availability: number
  cost: number
  unit: string
  description: string
}

export interface ProjectTask {
  id: string
  name: string
  description: string
  assignee: string
  startDate: Date
  endDate: Date
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  dependencies: string[]
  progress: number
}

export interface Milestone {
  id: string
  name: string
  description: string
  date: Date
  type: 'design' | 'approval' | 'construction' | 'testing' | 'delivery'
  status: 'pending' | 'achieved' | 'missed'
  criteria: string[]
}

export interface ProjectDependency {
  id: string
  from: string
  to: string
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
  lag: number
  description: string
}

export interface ProjectScope {
  deliverables: Deliverable[]
  requirements: Requirement[]
  constraints: Constraint[]
  assumptions: string[]
  exclusions: string[]
}

export interface Deliverable {
  id: string
  name: string
  description: string
  type: 'document' | 'software' | 'hardware' | 'service' | 'building'
  owner: string
  dueDate: Date
  status: 'pending' | 'in_progress' | 'completed' | 'approved'
  acceptanceCriteria: string[]
}

export interface Requirement {
  id: string
  name: string
  description: string
  type: 'functional' | 'non_functional' | 'business' | 'technical' | 'legal'
  priority: 'must' | 'should' | 'could' | 'wont'
  source: string
  status: 'proposed' | 'approved' | 'implemented' | 'tested'
  traceability: string[]
}

export interface Constraint {
  id: string
  name: string
  description: string
  type: 'budget' | 'time' | 'scope' | 'quality' | 'resource' | 'regulatory'
  impact: 'low' | 'medium' | 'high' | 'critical'
  mitigation: string
}

export interface ProjectStakeholder {
  id: string
  name: string
  role: string
  organization: string
  contact: string
  influence: 'low' | 'medium' | 'high'
  interest: 'low' | 'medium' | 'high'
  attitude: 'supporter' | 'neutral' | 'resistant'
  requirements: string[]
}

export interface EvaluationCriteria {
  id: string
  name: string
  description: string
  category: 'financial' | 'technical' | 'market' | 'legal' | 'risk' | 'strategic'
  weight: number
  metrics: EvaluationMetric[]
  benchmarks: Benchmark[]
}

export interface EvaluationMetric {
  id: string
  name: string
  description: string
  type: 'quantitative' | 'qualitative'
  unit: string
  target: number
  actual: number
  score: number
  calculation: string
  sources: string[]
}

export interface Benchmark {
  id: string
  name: string
  value: number
  source: string
  date: Date
  category: string
}

export interface EvaluationResult {
  criteriaId: string
  score: number
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  findings: string[]
  recommendations: string[]
  evidence: string[]
  confidence: number
}

export interface ProjectRisk {
  id: string
  name: string
  description: string
  category: 'financial' | 'technical' | 'market' | 'operational' | 'legal' | 'environmental'
  probability: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  impact: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  riskScore: number
  mitigation: RiskMitigation
  owner: string
  status: 'identified' | 'assessed' | 'mitigated' | 'monitored' | 'closed'
}

export interface RiskMitigation {
  strategy: 'avoid' | 'mitigate' | 'transfer' | 'accept'
  actions: string[]
  cost: number
  timeline: number
  effectiveness: number
  monitoring: string[]
}

export interface FinancialAnalysis {
  npv: number
  irr: number
  paybackPeriod: number
  roi: number
  profitabilityIndex: number
  sensitivity: SensitivityAnalysis
  scenarios: ScenarioAnalysis[]
  assumptions: FinancialAssumption[]
}

export interface SensitivityAnalysis {
  variables: SensitivityVariable[]
  results: SensitivityResult[]
}

export interface SensitivityVariable {
  name: string
  baseValue: number
  range: number
  impact: number
}

export interface SensitivityResult {
  variable: string
  change: number
  npvChange: number
  irrChange: number
}

export interface ScenarioAnalysis {
  name: string
  description: string
  probability: number
  assumptions: Record<string, any>
  results: FinancialResults
}

export interface FinancialResults {
  npv: number
  irr: number
  payback: number
  roi: number
  cashFlow: CashFlowItem[]
}

export interface FinancialAssumption {
  name: string
  value: any
  source: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
}

export interface MarketAnalysis {
  marketSize: number
  growth: number
  trends: MarketTrend[]
  competition: Competitor[]
  opportunities: MarketOpportunity[]
  threats: MarketThreat[]
  positioning: MarketPositioning
}

export interface MarketTrend {
  name: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  probability: number
  timeframe: string
}

export interface Competitor {
  name: string
  description: string
  marketShare: number
  strengths: string[]
  weaknesses: string[]
  strategy: string
  threat: 'low' | 'medium' | 'high'
}

export interface MarketOpportunity {
  name: string
  description: string
  value: number
  probability: number
  timeframe: string
  requirements: string[]
}

export interface MarketThreat {
  name: string
  description: string
  impact: number
  probability: number
  mitigation: string[]
}

export interface MarketPositioning {
  target: string
  value: string
  differentiation: string[]
  competitive: string[]
  messaging: string
}

export interface TechnicalAnalysis {
  feasibility: TechnicalFeasibility
  complexity: TechnicalComplexity
  innovation: TechnicalInnovation
  resources: TechnicalResource[]
  risks: TechnicalRisk[]
  alternatives: TechnicalAlternative[]
}

export interface TechnicalFeasibility {
  overall: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  aspects: TechnicalAspect[]
  constraints: TechnicalConstraint[]
  requirements: TechnicalRequirement[]
}

export interface TechnicalAspect {
  name: string
  feasibility: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  evidence: string[]
  concerns: string[]
}

export interface TechnicalConstraint {
  name: string
  description: string
  impact: 'low' | 'medium' | 'high'
  workaround: string
}

export interface TechnicalRequirement {
  name: string
  description: string
  type: 'functional' | 'performance' | 'security' | 'compatibility'
  priority: 'must' | 'should' | 'could'
  complexity: 'low' | 'medium' | 'high'
}

export interface TechnicalComplexity {
  overall: 'low' | 'medium' | 'high' | 'very_high'
  factors: ComplexityFactor[]
  mitigation: string[]
}

export interface ComplexityFactor {
  name: string
  level: 'low' | 'medium' | 'high'
  description: string
  impact: string
}

export interface TechnicalInnovation {
  level: 'low' | 'medium' | 'high' | 'breakthrough'
  areas: InnovationArea[]
  benefits: string[]
  risks: string[]
}

export interface InnovationArea {
  name: string
  description: string
  novelty: 'incremental' | 'radical' | 'disruptive'
  readiness: 'concept' | 'prototype' | 'pilot' | 'mature'
}

export interface TechnicalResource {
  type: 'human' | 'equipment' | 'software' | 'infrastructure'
  name: string
  description: string
  availability: 'available' | 'limited' | 'unavailable'
  cost: number
  criticality: 'low' | 'medium' | 'high'
}

export interface TechnicalRisk {
  name: string
  description: string
  probability: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  impact: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  mitigation: string[]
}

export interface TechnicalAlternative {
  name: string
  description: string
  pros: string[]
  cons: string[]
  cost: number
  complexity: 'low' | 'medium' | 'high'
  feasibility: 'low' | 'medium' | 'high'
}

export interface LegalAnalysis {
  compliance: ComplianceAnalysis
  permits: PermitAnalysis[]
  contracts: ContractAnalysis[]
  intellectual: IntellectualProperty[]
  liability: LiabilityAnalysis
  regulatory: RegulatoryAnalysis
}

export interface ComplianceAnalysis {
  overall: 'compliant' | 'partial' | 'non_compliant'
  requirements: ComplianceRequirement[]
  gaps: ComplianceGap[]
  recommendations: string[]
}

export interface ComplianceRequirement {
  name: string
  description: string
  source: string
  status: 'met' | 'partial' | 'not_met'
  evidence: string[]
  deadline?: Date
}

export interface ComplianceGap {
  requirement: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  remediation: string
  cost: number
  timeline: number
}

export interface PermitAnalysis {
  name: string
  description: string
  authority: string
  status: 'not_required' | 'required' | 'applied' | 'approved' | 'rejected'
  timeline: number
  cost: number
  requirements: string[]
  risks: string[]
}

export interface ContractAnalysis {
  name: string
  type: 'supplier' | 'customer' | 'partner' | 'employment' | 'licensing'
  status: 'draft' | 'negotiation' | 'signed' | 'executed' | 'terminated'
  risks: ContractRisk[]
  terms: ContractTerm[]
  obligations: ContractObligation[]
}

export interface ContractRisk {
  name: string
  description: string
  impact: 'low' | 'medium' | 'high'
  probability: 'low' | 'medium' | 'high'
  mitigation: string
}

export interface ContractTerm {
  name: string
  description: string
  favorable: 'yes' | 'no' | 'neutral'
  negotiable: boolean
  impact: string
}

export interface ContractObligation {
  name: string
  description: string
  deadline: Date
  owner: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
}

export interface IntellectualProperty {
  type: 'patent' | 'trademark' | 'copyright' | 'trade_secret'
  name: string
  description: string
  owner: string
  status: 'pending' | 'granted' | 'expired' | 'rejected'
  jurisdiction: string
  protection: string[]
  risks: string[]
}

export interface LiabilityAnalysis {
  overall: 'low' | 'medium' | 'high' | 'very_high'
  areas: LiabilityArea[]
  insurance: InsuranceRequirement[]
  mitigation: string[]
}

export interface LiabilityArea {
  name: string
  description: string
  exposure: number
  probability: 'low' | 'medium' | 'high'
  mitigation: string[]
}

export interface InsuranceRequirement {
  type: string
  coverage: number
  premium: number
  deductible: number
  requirements: string[]
}

export interface RegulatoryAnalysis {
  framework: RegulatoryFramework[]
  changes: RegulatoryChange[]
  compliance: RegulatoryCompliance[]
  monitoring: RegulatoryMonitoring[]
}

export interface RegulatoryFramework {
  name: string
  description: string
  authority: string
  scope: string
  applicability: 'high' | 'medium' | 'low'
  requirements: string[]
}

export interface RegulatoryChange {
  name: string
  description: string
  effective: Date
  impact: 'positive' | 'negative' | 'neutral'
  probability: 'low' | 'medium' | 'high'
  preparation: string[]
}

export interface RegulatoryCompliance {
  regulation: string
  status: 'compliant' | 'partial' | 'non_compliant'
  requirements: string[]
  evidence: string[]
  gaps: string[]
  timeline: number
}

export interface RegulatoryMonitoring {
  area: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  indicators: string[]
  thresholds: Record<string, number>
  actions: string[]
}

export interface EvaluationReport {
  id: string
  name: string
  type: 'executive' | 'detailed' | 'technical' | 'financial'
  format: 'pdf' | 'word' | 'excel' | 'powerpoint'
  createdAt: Date
  author: string
  content: string
  attachments: UploadedFile[]
  recipients: string[]
  status: 'draft' | 'review' | 'approved' | 'distributed'
}

// =============================================================================
// MARKETING PLANNER MODULE TYPES
// =============================================================================

export interface MarketingPlan {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  author: string
  collaborators: string[]
  objectives: MarketingObjective[]
  strategy: MarketingStrategy
  tactics: MarketingTactic[]
  budget: MarketingBudget
  timeline: MarketingTimeline
  metrics: MarketingMetric[]
  campaigns: MarketingCampaign[]
  channels: MarketingChannel[]
  audience: AudienceSegment[]
  content: ContentPlan
  analytics: MarketingAnalytics
}

export interface MarketingObjective {
  id: string
  name: string
  description: string
  type: 'awareness' | 'leads' | 'sales' | 'retention' | 'engagement'
  target: number
  current: number
  deadline: Date
  priority: 'low' | 'medium' | 'high'
  metrics: string[]
  status: 'pending' | 'in_progress' | 'achieved' | 'missed'
}

export interface MarketingStrategy {
  positioning: string
  value: string
  differentiation: string[]
  competitive: string[]
  messaging: MarketingMessage[]
  brand: BrandStrategy
  pricing: PricingStrategy
  distribution: DistributionStrategy
}

export interface ABTest {
  id: string
  name: string
  hypothesis: string
  variants: ABTestVariant[]
  metric: string
  status: 'draft' | 'running' | 'completed' | 'cancelled'
  startDate: Date
  endDate: Date
  results: ABTestResults
}

export interface ABTestVariant {
  id: string
  name: string
  description: string
  allocation: number
  conversions: number
  participants: number
}

export interface ABTestResults {
  winner?: string
  confidence: number
  significance: boolean
  improvement: number
  summary: string
}

export interface MarketingMessage {
  id: string
  audience: string
  message: string
  tone: 'professional' | 'casual' | 'urgent' | 'friendly'
  channels: string[]
  testing: ABTest[]
}

export interface BrandStrategy {
  identity: BrandIdentity
  voice: BrandVoice
  guidelines: BrandGuideline[]
  assets: BrandAsset[]
}

export interface BrandIdentity {
  mission: string
  vision: string
  values: string[]
  personality: string[]
  promise: string
}

export interface BrandVoice {
  tone: string
  style: string
  vocabulary: string[]
  examples: string[]
}

export interface BrandGuideline {
  category: string
  rules: string[]
  examples: string[]
  restrictions: string[]
}

export interface BrandAsset {
  type: 'logo' | 'color' | 'font' | 'image' | 'template'
  name: string
  description: string
  url: string
  usage: string[]
  restrictions: string[]
}

export interface PricingStrategy {
  model: 'cost_plus' | 'value_based' | 'competitive' | 'penetration' | 'skimming'
  tiers: PricingTier[]
  discounts: PricingDiscount[]
  psychology: PricingPsychology[]
}

export interface PricingTier {
  name: string
  price: number
  features: string[]
  target: string
  positioning: string
}

export interface PricingDiscount {
  type: 'percentage' | 'fixed' | 'bogo' | 'bundle'
  value: number
  conditions: string[]
  expiry: Date
  target: string
}

export interface PricingPsychology {
  technique: string
  application: string
  impact: string
  testing: string
}

export interface DistributionStrategy {
  channels: DistributionChannel[]
  partners: DistributionPartner[]
  coverage: string
  exclusivity: string
}

export interface DistributionChannel {
  name: string
  type: 'direct' | 'retail' | 'online' | 'partner'
  reach: number
  cost: number
  margin: number
  requirements: string[]
}

export interface DistributionPartner {
  name: string
  type: 'retailer' | 'distributor' | 'agent' | 'affiliate'
  reach: number
  terms: string[]
  performance: number
}

export interface MarketingTactic {
  id: string
  name: string
  description: string
  type: 'advertising' | 'content' | 'social' | 'email' | 'events' | 'pr' | 'seo'
  objectives: string[]
  channels: string[]
  audience: string[]
  budget: number
  timeline: MarketingTimeline
  metrics: string[]
  status: 'planned' | 'active' | 'paused' | 'completed'
  performance: TacticPerformance
}

export interface TacticPerformance {
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  cpa: number
  roi: number
  quality: number
}

export interface MarketingBudget {
  total: number
  allocated: number
  spent: number
  remaining: number
  breakdown: BudgetBreakdown[]
  forecast: BudgetForecast[]
  tracking: BudgetTracking[]
}

export interface BudgetBreakdown {
  category: string
  allocated: number
  spent: number
  remaining: number
  percentage: number
  performance: number
}

export interface BudgetForecast {
  period: string
  expected: number
  actual: number
  variance: number
  factors: string[]
}

export interface BudgetTracking {
  date: Date
  category: string
  amount: number
  description: string
  campaign: string
  approved: boolean
}

export interface MarketingTimeline {
  startDate: Date
  endDate: Date
  phases: MarketingPhase[]
  milestones: MarketingMilestone[]
  dependencies: MarketingDependency[]
}

export interface MarketingPhase {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  objectives: string[]
  activities: MarketingActivity[]
  deliverables: string[]
  budget: number
}

export interface MarketingActivity {
  id: string
  name: string
  description: string
  type: string
  owner: string
  startDate: Date
  endDate: Date
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  dependencies: string[]
  resources: string[]
}

export interface MarketingMilestone {
  id: string
  name: string
  description: string
  date: Date
  type: 'launch' | 'review' | 'optimization' | 'completion'
  criteria: string[]
  status: 'pending' | 'achieved' | 'missed'
}

export interface MarketingDependency {
  id: string
  from: string
  to: string
  type: 'blocks' | 'triggers' | 'informs'
  description: string
}

export interface MarketingMetric {
  id: string
  name: string
  description: string
  type: 'awareness' | 'engagement' | 'conversion' | 'retention' | 'revenue'
  unit: string
  target: number
  current: number
  trend: 'up' | 'down' | 'stable'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  source: string
  calculation: string
}

export interface MarketingCampaign {
  id: string
  name: string
  description: string
  type: 'awareness' | 'acquisition' | 'retention' | 'advocacy'
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
  startDate: Date
  endDate: Date
  budget: number
  objectives: string[]
  audience: string[]
  channels: string[]
  creative: CreativeAsset[]
  performance: CampaignPerformance
  optimization: CampaignOptimization[]
}

export interface CreativeAsset {
  id: string
  name: string
  type: 'image' | 'video' | 'text' | 'html' | 'audio'
  format: string
  size: string
  url: string
  description: string
  usage: string[]
  performance: AssetPerformance
}

export interface AssetPerformance {
  impressions: number
  clicks: number
  conversions: number
  engagement: number
  quality: number
  feedback: string[]
}

export interface CampaignPerformance {
  impressions: number
  reach: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpc: number
  cpa: number
  roas: number
  quality: number
}

export interface CampaignOptimization {
  date: Date
  type: 'budget' | 'targeting' | 'creative' | 'bidding'
  change: string
  reason: string
  impact: string
  result: string
}

export interface MarketingChannel {
  id: string
  name: string
  type: 'paid' | 'owned' | 'earned'
  category: 'digital' | 'traditional' | 'social' | 'content'
  description: string
  reach: number
  cost: number
  effectiveness: number
  audience: string[]
  content: string[]
  metrics: string[]
  integration: ChannelIntegration[]
}

export interface ChannelIntegration {
  channel: string
  type: 'amplification' | 'retargeting' | 'attribution' | 'data_sharing'
  description: string
  setup: string[]
  benefits: string[]
}

export interface AudienceSegment {
  id: string
  name: string
  description: string
  size: number
  demographics: Demographics
  psychographics: Psychographics
  behaviors: Behaviors
  preferences: Preferences
  journey: CustomerJourney
  value: CustomerValue
  targeting: TargetingCriteria
}

export interface Demographics {
  age: AgeRange
  gender: GenderDistribution
  income: IncomeRange
  education: EducationLevel[]
  occupation: string[]
  location: LocationData
  family: FamilyStatus
}

export interface AgeRange {
  min: number
  max: number
  median: number
  distribution: Record<string, number>
}

export interface GenderDistribution {
  male: number
  female: number
  other: number
  unknown: number
}

export interface IncomeRange {
  min: number
  max: number
  median: number
  distribution: Record<string, number>
}

export interface EducationLevel {
  level: string
  percentage: number
}

export interface LocationData {
  countries: Record<string, number>
  regions: Record<string, number>
  cities: Record<string, number>
  urban: number
  rural: number
}

export interface FamilyStatus {
  single: number
  married: number
  divorced: number
  children: number
  household: number
}

export interface Psychographics {
  personality: PersonalityTraits
  values: ValueSystem
  interests: InterestAreas
  lifestyle: LifestyleFactors
  attitudes: AttitudeProfiles
}

export interface PersonalityTraits {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
}

export interface ValueSystem {
  primary: string[]
  secondary: string[]
  importance: Record<string, number>
}

export interface InterestAreas {
  categories: Record<string, number>
  specific: Record<string, number>
  trending: string[]
}

export interface LifestyleFactors {
  activities: string[]
  hobbies: string[]
  media: string[]
  shopping: string[]
  travel: string[]
}

export interface AttitudeProfiles {
  brand: BrandAttitude
  innovation: InnovationAttitude
  price: PriceAttitude
  quality: QualityAttitude
  service: ServiceAttitude
}

export interface BrandAttitude {
  loyalty: 'high' | 'medium' | 'low'
  switching: 'frequent' | 'occasional' | 'rare'
  advocacy: 'promoter' | 'passive' | 'detractor'
}

export interface InnovationAttitude {
  adoption: 'innovator' | 'early_adopter' | 'majority' | 'laggard'
  risk: 'high' | 'medium' | 'low'
  research: 'extensive' | 'moderate' | 'minimal'
}

export interface PriceAttitude {
  sensitivity: 'high' | 'medium' | 'low'
  value: 'premium' | 'fair' | 'budget'
  comparison: 'always' | 'sometimes' | 'never'
}

export interface QualityAttitude {
  importance: 'high' | 'medium' | 'low'
  standards: 'strict' | 'moderate' | 'flexible'
  trade_offs: string[]
}

export interface ServiceAttitude {
  expectations: 'high' | 'medium' | 'low'
  channels: string[]
  satisfaction: 'high' | 'medium' | 'low'
}

export interface Behaviors {
  purchase: PurchaseBehavior
  usage: UsageBehavior
  digital: DigitalBehavior
  social: SocialBehavior
  communication: CommunicationBehavior
}

export interface PurchaseBehavior {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
  timing: 'impulse' | 'planned' | 'researched'
  channels: string[]
  decision: DecisionProcess
  influences: string[]
}

export interface DecisionProcess {
  duration: number
  steps: string[]
  criteria: string[]
  research: string[]
  consultation: string[]
}

export interface UsageBehavior {
  frequency: 'heavy' | 'medium' | 'light'
  timing: string[]
  context: string[]
  duration: number
  features: string[]
}

export interface DigitalBehavior {
  devices: Record<string, number>
  platforms: Record<string, number>
  time: Record<string, number>
  activities: Record<string, number>
  engagement: Record<string, number>
}

export interface SocialBehavior {
  platforms: string[]
  activity: 'active' | 'passive' | 'lurker'
  sharing: 'frequent' | 'occasional' | 'rare'
  influence: 'high' | 'medium' | 'low'
  following: string[]
}

export interface CommunicationBehavior {
  channels: string[]
  frequency: Record<string, number>
  preferences: string[]
  timing: string[]
  response: string[]
}

export interface Preferences {
  content: ContentPreferences
  channels: ChannelPreferences
  timing: TimingPreferences
  format: FormatPreferences
  personalization: PersonalizationPreferences
}

export interface ContentPreferences {
  topics: string[]
  tone: string[]
  length: 'short' | 'medium' | 'long'
  format: string[]
  interactivity: 'high' | 'medium' | 'low'
}

export interface ChannelPreferences {
  primary: string[]
  secondary: string[]
  avoid: string[]
  discovery: string[]
  purchase: string[]
}

export interface TimingPreferences {
  days: string[]
  hours: string[]
  frequency: string
  urgency: string
  scheduling: string[]
}

export interface FormatPreferences {
  visual: string[]
  audio: string[]
  text: string[]
  interactive: string[]
  length: string[]
}

export interface PersonalizationPreferences {
  level: 'high' | 'medium' | 'low' | 'none'
  data: string[]
  frequency: string
  channels: string[]
  content: string[]
}

export interface CustomerJourney {
  stages: JourneyStage[]
  touchpoints: Touchpoint[]
  emotions: EmotionMap
  pain_points: PainPoint[]
  opportunities: JourneyOpportunity[]
}

export interface JourneyStage {
  name: string
  description: string
  duration: number
  goals: string[]
  actions: string[]
  channels: string[]
  content: string[]
  metrics: string[]
}

export interface Touchpoint {
  name: string
  stage: string
  type: 'digital' | 'physical' | 'human'
  channel: string
  purpose: string
  frequency: number
  satisfaction: number
  importance: number
}

export interface EmotionMap {
  stages: Record<string, Emotion[]>
  overall: Emotion[]
  peaks: EmotionPeak[]
  valleys: EmotionValley[]
}

export interface Emotion {
  name: string
  intensity: number
  duration: number
  triggers: string[]
  impact: string
}

export interface EmotionPeak {
  stage: string
  emotion: string
  cause: string
  impact: string
  opportunity: string
}

export interface EmotionValley {
  stage: string
  emotion: string
  cause: string
  impact: string
  solution: string
}

export interface PainPoint {
  name: string
  stage: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  frequency: number
  impact: string
  causes: string[]
  solutions: string[]
}

export interface JourneyOpportunity {
  name: string
  stage: string
  description: string
  value: number
  effort: number
  priority: number
  requirements: string[]
  benefits: string[]
}

export interface CustomerValue {
  ltv: number
  frequency: number
  recency: number
  monetary: number
  segment: 'champions' | 'loyal' | 'potential' | 'new' | 'at_risk' | 'hibernating'
  acquisition: AcquisitionValue
  retention: RetentionValue
  development: DevelopmentValue
}

export interface AcquisitionValue {
  cost: number
  time: number
  probability: number
  channels: string[]
  requirements: string[]
}

export interface RetentionValue {
  rate: number
  factors: string[]
  risks: string[]
  programs: string[]
  investment: number
}

export interface DevelopmentValue {
  potential: number
  opportunities: string[]
  requirements: string[]
  timeline: number
  investment: number
}

export interface TargetingCriteria {
  demographics: Record<string, any>
  psychographics: Record<string, any>
  behaviors: Record<string, any>
  preferences: Record<string, any>
  custom: Record<string, any>
  exclusions: Record<string, any>
}

export interface ContentPlan {
  calendar: ContentCalendar
  themes: ContentTheme[]
  formats: ContentFormat[]
  channels: ContentChannel[]
  production: ContentProduction
  distribution: ContentDistribution
  performance: ContentPerformance
}

export interface ContentCalendar {
  entries: ContentEntry[]
  themes: CalendarTheme[]
  events: ContentEvent[]
  campaigns: string[]
  deadlines: ContentDeadline[]
}

export interface ContentEntry {
  id: string
  title: string
  description: string
  type: string
  format: string
  channel: string
  audience: string
  theme: string
  campaign: string
  author: string
  status: 'ideation' | 'planning' | 'creation' | 'review' | 'approved' | 'published'
  publishDate: Date
  deadline: Date
  performance: ContentMetrics
}

export interface CalendarTheme {
  name: string
  description: string
  period: string
  content: string[]
  goals: string[]
  metrics: string[]
}

export interface ContentEvent {
  name: string
  date: Date
  type: 'holiday' | 'industry' | 'company' | 'seasonal'
  relevance: number
  content: string[]
  preparation: number
}

export interface ContentDeadline {
  content: string
  deadline: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  owner: string
  dependencies: string[]
}

export interface ContentTheme {
  name: string
  description: string
  keywords: string[]
  audience: string[]
  channels: string[]
  formats: string[]
  frequency: string
  calendar: string
}

export interface ContentFormat {
  name: string
  description: string
  specifications: FormatSpecification[]
  channels: string[]
  audience: string[]
  production: ProductionRequirement[]
  performance: FormatPerformance
}

export interface FormatSpecification {
  aspect: string
  requirement: string
  optimal: string
  acceptable: string
  notes: string
}

export interface ProductionRequirement {
  resource: string
  quantity: number
  skill: string
  time: number
  cost: number
}

export interface FormatPerformance {
  engagement: number
  reach: number
  conversion: number
  cost: number
  quality: number
}

export interface ContentChannel {
  name: string
  type: 'owned' | 'earned' | 'paid'
  audience: string[]
  formats: string[]
  frequency: string
  guidelines: ChannelGuideline[]
  performance: ChannelPerformance
}

export interface ChannelGuideline {
  aspect: string
  requirement: string
  best_practice: string
  avoid: string
  examples: string[]
}

export interface ChannelPerformance {
  reach: number
  engagement: number
  conversion: number
  cost: number
  quality: number
  growth: number
}

export interface ContentProduction {
  workflow: ProductionWorkflow
  team: ProductionTeam
  tools: ProductionTool[]
  templates: ContentTemplate[]
  guidelines: ProductionGuideline[]
  quality: QualityControl
}

export interface ProductionWorkflow {
  stages: WorkflowStage[]
  approvals: ApprovalProcess[]
  deadlines: WorkflowDeadline[]
  automation: WorkflowAutomation[]
}

export interface WorkflowStage {
  name: string
  description: string
  owner: string
  duration: number
  inputs: string[]
  outputs: string[]
  dependencies: string[]
  tools: string[]
}

export interface ApprovalProcess {
  stage: string
  approver: string
  criteria: string[]
  timeline: number
  escalation: string
}

export interface WorkflowDeadline {
  stage: string
  deadline: number
  buffer: number
  critical: boolean
  impact: string
}

export interface WorkflowAutomation {
  process: string
  tool: string
  trigger: string
  actions: string[]
  benefits: string[]
}

export interface ProductionTeam {
  roles: TeamRole[]
  assignments: TeamAssignment[]
  capacity: TeamCapacity
  skills: TeamSkill[]
  training: TeamTraining[]
}

export interface TeamRole {
  name: string
  responsibilities: string[]
  skills: string[]
  tools: string[]
  capacity: number
}

export interface TeamAssignment {
  person: string
  role: string
  content: string[]
  workload: number
  deadline: Date
}

export interface TeamCapacity {
  total: number
  available: number
  allocated: number
  utilization: number
  bottlenecks: string[]
}

export interface TeamSkill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  people: string[]
  gaps: string[]
  development: string[]
}

export interface TeamTraining {
  topic: string
  priority: 'low' | 'medium' | 'high'
  people: string[]
  provider: string
  timeline: number
  cost: number
}

export interface ProductionTool {
  name: string
  type: 'creation' | 'editing' | 'collaboration' | 'management' | 'analytics'
  users: string[]
  features: string[]
  integration: string[]
  cost: number
  training: string[]
}

export interface ContentTemplate {
  name: string
  type: string
  format: string
  structure: TemplateStructure[]
  guidelines: TemplateGuideline[]
  examples: string[]
  usage: number
}

export interface TemplateStructure {
  section: string
  required: boolean
  guidelines: string[]
  examples: string[]
  variables: string[]
}

export interface TemplateGuideline {
  aspect: string
  requirement: string
  best_practice: string
  examples: string[]
}

export interface ProductionGuideline {
  category: string
  rules: string[]
  examples: string[]
  tools: string[]
  quality: string[]
}

export interface QualityControl {
  standards: QualityStandard[]
  checklist: QualityChecklist[]
  review: QualityReview
  testing: QualityTesting
  feedback: QualityFeedback
}

export interface QualityStandard {
  aspect: string
  requirement: string
  measurement: string
  threshold: number
  tools: string[]
}

export interface QualityChecklist {
  stage: string
  items: ChecklistItem[]
  owner: string
  mandatory: boolean
}

export interface ChecklistItem {
  item: string
  description: string
  check: boolean
  notes: string
}

export interface QualityReview {
  process: string
  reviewers: string[]
  criteria: string[]
  timeline: number
  feedback: string
}

export interface QualityTesting {
  type: string
  method: string
  sample: string
  metrics: string[]
  results: string
}

export interface QualityFeedback {
  source: string
  method: string
  frequency: string
  metrics: string[]
  actions: string[]
}

export interface ContentDistribution {
  strategy: DistributionStrategy
  channels: DistributionChannel[]
  schedule: DistributionSchedule
  automation: DistributionAutomation
  optimization: DistributionOptimization
}

export interface DistributionSchedule {
  entries: ScheduleEntry[]
  recurring: RecurringSchedule[]
  exceptions: ScheduleException[]
  optimization: ScheduleOptimization
}

export interface ScheduleEntry {
  content: string
  channel: string
  datetime: Date
  timezone: string
  status: 'scheduled' | 'published' | 'failed'
  performance: ChannelPerformance
}

export interface RecurringSchedule {
  pattern: string
  frequency: string
  timing: string
  channels: string[]
  content: string[]
  exceptions: Date[]
}

export interface ScheduleException {
  date: Date
  reason: string
  alternative: string
  impact: string
}

export interface ScheduleOptimization {
  factors: string[]
  recommendations: string[]
  testing: string[]
  results: string[]
}

export interface DistributionAutomation {
  rules: AutomationRule[]
  triggers: AutomationTrigger[]
  actions: AutomationAction[]
  monitoring: AutomationMonitoring
}

export interface AutomationRule {
  name: string
  condition: string
  action: string
  channels: string[]
  frequency: string
  exceptions: string[]
}

export interface AutomationTrigger {
  type: string
  event: string
  conditions: string[]
  actions: string[]
  delay: number
}

export interface AutomationAction {
  type: string
  description: string
  parameters: Record<string, any>
  fallback: string
  monitoring: string[]
}

export interface AutomationMonitoring {
  metrics: string[]
  alerts: string[]
  reporting: string
  optimization: string[]
}

export interface DistributionOptimization {
  testing: OptimizationTesting
  personalization: OptimizationPersonalization
  timing: OptimizationTiming
  channels: OptimizationChannels
}

export interface OptimizationTesting {
  type: string
  variables: string[]
  metrics: string[]
  duration: number
  results: string
}

export interface OptimizationPersonalization {
  level: 'basic' | 'advanced' | 'ai_driven'
  factors: string[]
  segments: string[]
  rules: string[]
  performance: string
}

export interface OptimizationTiming {
  factors: string[]
  patterns: string[]
  recommendations: string[]
  testing: string[]
  results: string
}

export interface OptimizationChannels {
  performance: Record<string, number>
  recommendations: string[]
  allocation: Record<string, number>
  testing: string[]
}

export interface ContentPerformance {
  metrics: ContentMetrics
  analytics: ContentAnalytics
  reporting: ContentReporting
  optimization: ContentOptimization
}

export interface ContentMetrics {
  reach: number
  impressions: number
  engagement: number
  clicks: number
  conversions: number
  shares: number
  saves: number
  comments: number
  sentiment: number
  quality: number
}

export interface ContentAnalytics {
  audience: AudienceAnalytics
  performance: PerformanceAnalytics
  competitive: CompetitiveAnalytics
  trends: TrendAnalytics
}

export interface AudienceAnalytics {
  demographics: Demographics
  behavior: AudienceBehavior
  preferences: AudiencePreferences
  engagement: AudienceEngagement
  growth: AudienceGrowth
}

export interface AudienceBehavior {
  consumption: string[]
  interaction: string[]
  sharing: string[]
  timing: string[]
  devices: string[]
}

export interface AudiencePreferences {
  topics: string[]
  formats: string[]
  channels: string[]
  timing: string[]
  length: string[]
}

export interface AudienceEngagement {
  rate: number
  depth: number
  quality: number
  loyalty: number
  advocacy: number
}

export interface AudienceGrowth {
  rate: number
  sources: string[]
  retention: number
  churn: number
  lifetime: number
}

export interface PerformanceAnalytics {
  content: ContentPerformanceData
  channels: ChannelPerformanceData
  campaigns: CampaignPerformanceData
  time: TimePerformanceData
}

export interface ContentPerformanceData {
  top: string[]
  bottom: string[]
  trends: string[]
  patterns: string[]
  insights: string[]
}

export interface ChannelPerformanceData {
  ranking: string[]
  efficiency: Record<string, number>
  growth: Record<string, number>
  optimization: string[]
}

export interface CampaignPerformanceData {
  success: string[]
  failure: string[]
  learnings: string[]
  recommendations: string[]
}

export interface TimePerformanceData {
  patterns: string[]
  seasonality: string[]
  trends: string[]
  forecasts: string[]
}

export interface CompetitiveAnalytics {
  competitors: CompetitorAnalysis[]
  benchmarks: CompetitiveBenchmark[]
  gaps: CompetitiveGap[]
  opportunities: CompetitiveOpportunity[]
}

export interface CompetitorAnalysis {
  name: string
  share: number
  strategy: string
  strengths: string[]
  weaknesses: string[]
  content: string[]
  channels: string[]
  performance: string[]
}

export interface CompetitiveBenchmark {
  metric: string
  us: number
  competitor: number
  industry: number
  gap: number
  opportunity: string
}

export interface CompetitiveGap {
  area: string
  description: string
  impact: string
  opportunity: string
  effort: string
}

export interface CompetitiveOpportunity {
  name: string
  description: string
  value: number
  effort: number
  timeline: number
  requirements: string[]
}

export interface TrendAnalytics {
  content: ContentTrend[]
  audience: AudienceTrend[]
  channel: ChannelTrend[]
  industry: IndustryTrend[]
}

export interface ContentTrend {
  name: string
  direction: 'rising' | 'falling' | 'stable'
  velocity: number
  impact: string
  opportunity: string
}

export interface AudienceTrend {
  segment: string
  behavior: string
  change: string
  impact: string
  strategy: string
}

export interface ChannelTrend {
  channel: string
  trend: string
  impact: string
  recommendation: string
}

export interface IndustryTrend {
  trend: string
  impact: string
  timeline: string
  opportunity: string
  threat: string
}

export interface ContentReporting {
  dashboards: ReportDashboard[]
  reports: ContentReport[]
  alerts: ContentAlert[]
  automation: ReportAutomation
}

export interface ReportDashboard {
  name: string
  audience: string[]
  metrics: string[]
  visualizations: string[]
  frequency: string
  access: string[]
}

export interface ContentReport {
  name: string
  type: 'performance' | 'analytics' | 'competitive' | 'trend'
  scope: string
  metrics: string[]
  insights: string[]
  recommendations: string[]
  schedule: string
  recipients: string[]
}

export interface ContentAlert {
  name: string
  condition: string
  threshold: number
  recipients: string[]
  actions: string[]
  frequency: string
}

export interface ReportAutomation {
  triggers: string[]
  generation: string[]
  distribution: string[]
  customization: string[]
}

export interface ContentOptimization {
  opportunities: OptimizationOpportunity[]
  recommendations: OptimizationRecommendation[]
  testing: OptimizationTest[]
  results: OptimizationResult[]
}

export interface OptimizationOpportunity {
  area: string
  description: string
  impact: string
  effort: string
  priority: number
  timeline: number
}

export interface OptimizationRecommendation {
  category: string
  recommendation: string
  rationale: string
  implementation: string[]
  metrics: string[]
  timeline: number
}

export interface OptimizationTest {
  name: string
  hypothesis: string
  variables: string[]
  metrics: string[]
  duration: number
  status: 'planned' | 'running' | 'completed'
  results: string
}

export interface OptimizationResult {
  test: string
  outcome: string
  impact: string
  learnings: string[]
  next_steps: string[]
}

export interface MarketingAnalytics {
  performance: MarketingPerformanceData
  attribution: AttributionAnalytics
  customer: CustomerAnalytics
  competitive: CompetitiveAnalytics
  predictive: PredictiveAnalytics
}

export interface MarketingPerformanceData {
  campaigns: CampaignPerformanceData
  channels: ChannelPerformanceData
  content: ContentPerformanceData
  audience: AudiencePerformanceData
}

export interface AudiencePerformanceData {
  segments: Record<string, number>
  behavior: Record<string, number>
  engagement: Record<string, number>
  conversion: Record<string, number>
}

export interface AttributionAnalytics {
  models: AttributionModel[]
  touchpoints: TouchpointAttribution[]
  journeys: JourneyAttribution[]
  insights: AttributionInsight[]
}

export interface AttributionModel {
  name: string
  type: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven'
  description: string
  results: AttributionResult[]
  accuracy: number
}

export interface AttributionResult {
  channel: string
  touchpoint: string
  credit: number
  conversions: number
  revenue: number
}

export interface TouchpointAttribution {
  touchpoint: string
  channel: string
  stage: string
  contribution: number
  influence: number
  optimization: string[]
}

export interface JourneyAttribution {
  path: string[]
  frequency: number
  conversion: number
  value: number
  optimization: string[]
}

export interface AttributionInsight {
  finding: string
  impact: string
  recommendation: string
  opportunity: string
}

export interface CustomerAnalytics {
  acquisition: AcquisitionAnalytics
  retention: RetentionAnalytics
  lifetime: LifetimeAnalytics
  segmentation: SegmentationAnalytics
}

export interface AcquisitionAnalytics {
  channels: Record<string, AcquisitionMetrics>
  campaigns: Record<string, AcquisitionMetrics>
  cost: AcquisitionCost
  quality: AcquisitionQuality
}

export interface AcquisitionMetrics {
  volume: number
  cost: number
  quality: number
  ltv: number
  roi: number
}

export interface AcquisitionCost {
  overall: number
  by_channel: Record<string, number>
  by_campaign: Record<string, number>
  trends: CostTrend[]
}

export interface CostTrend {
  period: string
  cost: number
  volume: number
  efficiency: number
}

export interface AcquisitionQuality {
  score: number
  factors: QualityFactor[]
  predictors: QualityPredictor[]
  improvement: QualityImprovement[]
}

export interface QualityFactor {
  name: string
  weight: number
  impact: string
  optimization: string[]
}

export interface QualityPredictor {
  signal: string
  strength: number
  application: string
  performance: string
}

export interface QualityImprovement {
  area: string
  opportunity: string
  impact: string
  effort: string
}

export interface RetentionAnalytics {
  rates: RetentionRate[]
  cohorts: CohortAnalysis[]
  factors: RetentionFactor[]
  programs: RetentionProgram[]
}

export interface RetentionRate {
  period: string
  rate: number
  cohort: string
  segment: string
  trend: string
}

export interface CohortAnalysis {
  cohort: string
  size: number
  retention: number[]
  revenue: number[]
  behavior: string[]
}

export interface RetentionFactor {
  factor: string
  impact: number
  significance: number
  optimization: string[]
}

export interface RetentionProgram {
  name: string
  target: string
  tactics: string[]
  performance: number
  roi: number
}

export interface LifetimeAnalytics {
  value: LifetimeValue
  duration: LifetimeDuration
  stages: LifetimeStage[]
  optimization: LifetimeOptimization[]
}

export interface LifetimeValue {
  average: number
  median: number
  distribution: Record<string, number>
  segments: Record<string, number>
  trends: ValueTrend[]
}

export interface ValueTrend {
  period: string
  value: number
  growth: number
  factors: string[]
}

export interface LifetimeDuration {
  average: number
  median: number
  distribution: Record<string, number>
  segments: Record<string, number>
  factors: string[]
}

export interface LifetimeStage {
  stage: string
  duration: number
  value: number
  activities: string[]
  optimization: string[]
}

export interface LifetimeOptimization {
  opportunity: string
  impact: string
  tactics: string[]
  investment: number
  roi: number
}

export interface SegmentationAnalytics {
  segments: SegmentAnalysis[]
  performance: SegmentPerformance[]
  migration: SegmentMigration[]
  optimization: SegmentOptimization[]
}

export interface SegmentAnalysis {
  segment: string
  size: number
  characteristics: string[]
  behavior: string[]
  value: number
  potential: number
}

export interface SegmentPerformance {
  segment: string
  acquisition: number
  retention: number
  development: number
  profitability: number
}

export interface SegmentMigration {
  from: string
  to: string
  rate: number
  factors: string[]
  value: number
}

export interface SegmentOptimization {
  segment: string
  opportunities: string[]
  tactics: string[]
  investment: number
  return: number
}

export interface PredictiveAnalytics {
  models: PredictiveModel[]
  forecasts: MarketingForecast[]
  insights: PredictiveInsight[]
  recommendations: PredictiveRecommendation[]
}

export interface PredictiveModel {
  name: string
  type: 'classification' | 'regression' | 'clustering' | 'time_series'
  target: string
  features: string[]
  accuracy: number
  performance: ModelPerformance
}

export interface ModelPerformance {
  training: number
  validation: number
  test: number
  stability: number
  drift: number
}

export interface MarketingForecast {
  metric: string
  horizon: string
  prediction: number
  confidence: number
  factors: string[]
  scenarios: ForecastScenario[]
}

export interface ForecastScenario {
  name: string
  probability: number
  assumptions: string[]
  prediction: number
  impact: string
}

export interface PredictiveInsight {
  finding: string
  confidence: number
  impact: string
  opportunity: string
  risk: string
}

export interface PredictiveRecommendation {
  action: string
  rationale: string
  expected: string
  risk: string
  timeline: number
}

// =============================================================================
// KNOWLEDGE BASE MODULE TYPES
// =============================================================================

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'archived' | 'maintenance'
  visibility: 'public' | 'internal' | 'private'
  owner: string
  contributors: string[]
  categories: KnowledgeCategory[]
  articles: KnowledgeArticle[]
  tags: KnowledgeTag[]
  search: KnowledgeSearch
  analytics: KnowledgeAnalytics
  settings: KnowledgeSettings
}

export interface KnowledgeCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  parentId?: string
  subcategories: KnowledgeCategory[]
  articles: string[]
  order: number
  visibility: 'public' | 'internal' | 'private'
  permissions: CategoryPermission[]
}

export interface CategoryPermission {
  role: string
  actions: ('read' | 'write' | 'admin')[]
  users: string[]
  groups: string[]
}

export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  summary: string
  author: string
  contributors: string[]
  categories: string[]
  tags: string[]
  status: 'draft' | 'review' | 'published' | 'archived'
  version: number
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  expiresAt?: Date
  visibility: 'public' | 'internal' | 'private'
  featured: boolean
  priority: 'low' | 'medium' | 'high'
  format: 'markdown' | 'html' | 'rich_text'
  metadata: ArticleMetadata
  content_blocks: ContentBlock[]
  attachments: KnowledgeAttachment[]
  relations: ArticleRelation[]
  feedback: ArticleFeedback[]
  analytics: ArticleAnalytics
  permissions: ArticlePermission[]
  workflow: ArticleWorkflow
}

export interface ArticleMetadata {
  type: 'how_to' | 'faq' | 'policy' | 'procedure' | 'reference' | 'troubleshooting'
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  audience: string[]
  products: string[]
  services: string[]
  platforms: string[]
  languages: string[]
  readingTime: number
  lastReviewed: Date
  reviewDue: Date
  accuracy: number
  completeness: number
  usefulness: number
}

export interface ContentBlock {
  id: string
  type: 'text' | 'code' | 'image' | 'video' | 'table' | 'list' | 'quote' | 'callout'
  content: string
  order: number
  metadata: Record<string, any>
  conditional: BlockConditional
}

export interface BlockConditional {
  show: boolean
  conditions: ConditionalRule[]
  fallback: string
}

export interface ConditionalRule {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater' | 'less'
  value: any
  logic: 'and' | 'or'
}

export interface KnowledgeAttachment {
  id: string
  name: string
  type: 'image' | 'video' | 'document' | 'audio' | 'archive' | 'other'
  format: string
  size: number
  url: string
  description: string
  uploadedAt: Date
  uploadedBy: string
  downloadCount: number
  virus_scan: 'pending' | 'clean' | 'infected'
}

export interface ArticleRelation {
  id: string
  type: 'related' | 'prerequisite' | 'follow_up' | 'alternative' | 'supersedes'
  articleId: string
  title: string
  strength: number
  auto_generated: boolean
  verified: boolean
}

export interface ArticleFeedback {
  id: string
  type: 'rating' | 'comment' | 'correction' | 'suggestion'
  user: string
  rating: number
  comment: string
  helpful: boolean
  category: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  createdAt: Date
  response: string
  respondedAt?: Date
  respondedBy?: string
}

export interface ArticleAnalytics {
  views: number
  unique_views: number
  time_on_page: number
  bounce_rate: number
  completion_rate: number
  search_appearances: number
  search_clicks: number
  external_links: number
  downloads: number
  shares: number
  bookmarks: number
  feedback_score: number
  helpfulness: number
  accuracy_reports: number
  update_requests: number
  trends: AnalyticsTrend[]
}

export interface AnalyticsTrend {
  period: string
  metric: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

export interface ArticlePermission {
  user: string
  role: string
  actions: ('read' | 'write' | 'review' | 'publish' | 'admin')[]
  granted_by: string
  granted_at: Date
  expires_at?: Date
}

export interface ArticleWorkflow {
  stage: 'draft' | 'review' | 'approval' | 'published'
  assignee: string
  reviewer: string
  approver: string
  due_date: Date
  history: WorkflowHistory[]
  comments: WorkflowComment[]
  checklist: WorkflowChecklist[]
}

export interface WorkflowHistory {
  action: string
  user: string
  timestamp: Date
  details: string
  from_stage: string
  to_stage: string
}

export interface WorkflowComment {
  id: string
  user: string
  comment: string
  timestamp: Date
  resolved: boolean
  thread: WorkflowComment[]
}

export interface WorkflowChecklist {
  item: string
  completed: boolean
  required: boolean
  completed_by: string
  completed_at: Date
}

export interface KnowledgeTag {
  id: string
  name: string
  description: string
  color: string
  usage_count: number
  type: 'manual' | 'auto' | 'suggested'
  category: string
  related_tags: string[]
  synonyms: string[]
  hierarchy: TagHierarchy
}

export interface TagHierarchy {
  parent: string
  children: string[]
  level: number
  path: string[]
}

export interface KnowledgeSearch {
  engine: 'elasticsearch' | 'algolia' | 'solr' | 'database'
  features: SearchFeature[]
  indexing: SearchIndexing
  analytics: SearchAnalytics
  configuration: SearchConfiguration
}

export interface SearchFeature {
  name: string
  enabled: boolean
  weight: number
  boost: number
  configuration: Record<string, any>
}

export interface SearchIndexing {
  last_full: Date
  last_incremental: Date
  status: 'healthy' | 'degraded' | 'failed'
  statistics: IndexingStatistics
  schedule: IndexingSchedule
}

export interface IndexingStatistics {
  total_articles: number
  indexed_articles: number
  failed_articles: number
  index_size: number
  processing_time: number
  errors: IndexingError[]
}

export interface IndexingError {
  article: string
  error: string
  timestamp: Date
  attempts: number
  resolved: boolean
}

export interface IndexingSchedule {
  full_index: string
  incremental: string
  cleanup: string
  optimization: string
}

export interface SearchAnalytics {
  queries: SearchQuery[]
  results: SearchResult[]
  performance: SearchPerformance
  trends: SearchTrend[]
}

export interface SearchQuery {
  query: string
  user: string
  timestamp: Date
  results_count: number
  clicked_result: string
  satisfied: boolean
  session: string
  filters: Record<string, any>
  suggestions: string[]
}

export interface SearchResult {
  query: string
  article: string
  position: number
  score: number
  clicked: boolean
  relevant: boolean
  timestamp: Date
}

export interface SearchPerformance {
  response_time: number
  success_rate: number
  click_through_rate: number
  satisfaction_rate: number
  zero_results_rate: number
  popular_queries: string[]
  failed_queries: string[]
}

export interface SearchTrend {
  period: string
  queries: number
  unique_queries: number
  results: number
  clicks: number
  satisfaction: number
  topics: string[]
}

export interface SearchConfiguration {
  synonyms: SearchSynonym[]
  stopwords: string[]
  stemming: boolean
  fuzzy_matching: boolean
  auto_complete: boolean
  spell_check: boolean
  facets: SearchFacet[]
  ranking: SearchRanking
}

export interface SearchSynonym {
  terms: string[]
  type: 'synonym' | 'one_way' | 'alternative'
  weight: number
  context: string
}

export interface SearchFacet {
  field: string
  name: string
  type: 'category' | 'tag' | 'date' | 'author' | 'custom'
  enabled: boolean
  order: number
  values: FacetValue[]
}

export interface FacetValue {
  value: string
  count: number
  selected: boolean
}

export interface SearchRanking {
  factors: RankingFactor[]
  boost: RankingBoost[]
  decay: RankingDecay[]
  personalization: RankingPersonalization
}

export interface RankingFactor {
  field: string
  weight: number
  function: 'linear' | 'log' | 'exponential' | 'custom'
  parameters: Record<string, any>
}

export interface RankingBoost {
  condition: string
  boost: number
  explanation: string
}

export interface RankingDecay {
  field: string
  origin: any
  scale: number
  decay: number
  function: 'linear' | 'exponential' | 'gaussian'
}

export interface RankingPersonalization {
  enabled: boolean
  factors: string[]
  weight: number
  fallback: string
}

export interface KnowledgeAnalytics {
  overview: AnalyticsOverview
  content: ContentAnalytics
  users: UserAnalytics
  search: SearchAnalytics
  feedback: FeedbackAnalytics
}

export interface AnalyticsOverview {
  total_articles: number
  total_views: number
  total_users: number
  total_searches: number
  average_rating: number
  content_health: ContentHealth
  user_engagement: UserEngagement
  system_performance: SystemPerformance
}

export interface ContentHealth {
  published: number
  outdated: number
  needs_review: number
  high_quality: number
  popular: number
  neglected: number
}

export interface UserEngagement {
  active_users: number
  returning_users: number
  session_duration: number
  pages_per_session: number
  bounce_rate: number
  contribution_rate: number
}

export interface SystemPerformance {
  response_time: number
  uptime: number
  error_rate: number
  search_performance: number
  content_freshness: number
  user_satisfaction: number
}

export interface UserAnalytics {
  segments: UserSegment[]
  behavior: UserBehavior[]
  journey: UserJourney[]
  retention: UserRetention[]
}

export interface UserSegment {
  name: string
  size: number
  characteristics: string[]
  behavior: string[]
  needs: string[]
  content: string[]
}

export interface UserBehavior {
  action: string
  frequency: number
  duration: number
  context: string[]
  outcomes: string[]
}

export interface UserJourney {
  path: string[]
  frequency: number
  completion: number
  drop_off: string[]
  optimization: string[]
}

export interface UserRetention {
  period: string
  rate: number
  cohort: string
  factors: string[]
  programs: string[]
}

export interface FeedbackAnalytics {
  ratings: FeedbackRating[]
  comments: FeedbackComment[]
  suggestions: FeedbackSuggestion[]
  sentiment: FeedbackSentiment
}

export interface FeedbackRating {
  rating: number
  count: number
  percentage: number
  articles: string[]
  trends: RatingTrend[]
}

export interface RatingTrend {
  period: string
  rating: number
  change: number
  factors: string[]
}

export interface FeedbackComment {
  category: string
  sentiment: 'positive' | 'negative' | 'neutral'
  themes: string[]
  frequency: number
  examples: string[]
}

export interface FeedbackSuggestion {
  type: string
  priority: 'low' | 'medium' | 'high'
  frequency: number
  implementation: string
  impact: string
}

export interface FeedbackSentiment {
  overall: number
  distribution: Record<string, number>
  trends: SentimentTrend[]
  factors: SentimentFactor[]
}

export interface SentimentTrend {
  period: string
  sentiment: number
  change: number
  drivers: string[]
}

export interface SentimentFactor {
  factor: string
  impact: number
  correlation: number
  examples: string[]
}

export interface KnowledgeSettings {
  general: GeneralSettings
  access: AccessSettings
  content: ContentSettings
  search: SearchSettings
  notifications: NotificationSettings
  integrations: IntegrationSettings
}

export interface GeneralSettings {
  name: string
  description: string
  logo: string
  theme: string
  language: string
  timezone: string
  contact: ContactSettings
  legal: LegalSettings
}

export interface ContactSettings {
  support_email: string
  support_url: string
  feedback_url: string
  admin_contacts: string[]
}

export interface LegalSettings {
  privacy_policy: string
  terms_of_service: string
  cookie_policy: string
  copyright: string
  disclaimer: string
}

export interface AccessSettings {
  authentication: AuthenticationSettings
  authorization: AuthorizationSettings
  security: SecuritySettings
  guest_access: GuestAccessSettings
}

export interface AuthenticationSettings {
  required: boolean
  methods: string[]
  sso: SSOSettings
  mfa: MFASettings
  session: SessionSettings
}

export interface SSOSettings {
  enabled: boolean
  providers: string[]
  auto_provision: boolean
  attribute_mapping: Record<string, string>
}

export interface MFASettings {
  required: boolean
  methods: string[]
  backup_codes: boolean
  remember_device: boolean
}

export interface SessionSettings {
  timeout: number
  remember: boolean
  concurrent: number
  activity_tracking: boolean
}

export interface AuthorizationSettings {
  default_role: string
  roles: RoleDefinition[]
  permissions: PermissionDefinition[]
  inheritance: boolean
}

export interface RoleDefinition {
  name: string
  description: string
  permissions: string[]
  inherits: string[]
  assignable: boolean
}

export interface PermissionDefinition {
  name: string
  description: string
  resource: string
  actions: string[]
  conditions: string[]
}

export interface SecuritySettings {
  encryption: boolean
  audit_logging: boolean
  rate_limiting: boolean
  ip_whitelist: string[]
  content_security: ContentSecuritySettings
}

export interface ContentSecuritySettings {
  virus_scanning: boolean
  file_validation: boolean
  content_filtering: boolean
  allowed_formats: string[]
  max_file_size: number
}

export interface GuestAccessSettings {
  enabled: boolean
  content: 'all' | 'public' | 'limited'
  features: string[]
  restrictions: string[]
}

export interface ContentSettings {
  creation: ContentCreationSettings
  editing: ContentEditingSettings
  publishing: ContentPublishingSettings
  archiving: ContentArchivingSettings
}

export interface ContentCreationSettings {
  templates: string[]
  required_fields: string[]
  default_values: Record<string, any>
  validation: ContentValidationSettings
}

export interface ContentValidationSettings {
  spelling: boolean
  grammar: boolean
  links: boolean
  images: boolean
  accessibility: boolean
  quality: QualitySettings
}

export interface QualitySettings {
  minimum_score: number
  checks: QualityCheck[]
  auto_suggestions: boolean
  reviewer_assignment: boolean
}

export interface QualityCheck {
  name: string
  enabled: boolean
  weight: number
  threshold: number
  auto_fix: boolean
}

export interface ContentEditingSettings {
  collaborative: boolean
  versioning: boolean
  auto_save: boolean
  conflict_resolution: 'merge' | 'overwrite' | 'manual'
  change_tracking: boolean
}

export interface ContentPublishingSettings {
  workflow: boolean
  approval: boolean
  scheduling: boolean
  auto_publish: boolean
  notifications: boolean
}

export interface ContentArchivingSettings {
  auto_archive: boolean
  criteria: ArchivingCriteria[]
  retention: RetentionPolicy[]
  cleanup: CleanupPolicy[]
}

export interface ArchivingCriteria {
  field: string
  condition: string
  value: any
  action: 'archive' | 'delete' | 'flag'
}

export interface RetentionPolicy {
  content_type: string
  duration: number
  action: 'archive' | 'delete' | 'review'
  exceptions: string[]
}

export interface CleanupPolicy {
  target: string
  frequency: string
  conditions: string[]
  actions: string[]
}

export interface SearchSettings {
  engine: string
  indexing: IndexingSettings
  features: SearchFeatureSettings[]
  performance: SearchPerformanceSettings
}

export interface IndexingSettings {
  auto_index: boolean
  frequency: string
  batch_size: number
  priority: IndexingPriority[]
}

export interface IndexingPriority {
  content_type: string
  priority: number
  frequency: string
}

export interface SearchFeatureSettings {
  feature: string
  enabled: boolean
  configuration: Record<string, any>
  weight: number
}

export interface SearchPerformanceSettings {
  cache: boolean
  cache_duration: number
  timeout: number
  batch_size: number
  optimization: boolean
}

export interface NotificationSettings {
  email: EmailNotificationSettings
  browser: BrowserNotificationSettings
  mobile: MobileNotificationSettings
  integrations: NotificationIntegrationSettings
}

export interface EmailNotificationSettings {
  enabled: boolean
  templates: EmailTemplate[]
  frequency: string
  digest: boolean
}

export interface EmailTemplate {
  name: string
  subject: string
  body: string
  variables: string[]
  conditions: string[]
}

export interface BrowserNotificationSettings {
  enabled: boolean
  types: string[]
  frequency: string
  sound: boolean
}

export interface MobileNotificationSettings {
  enabled: boolean
  push: boolean
  sms: boolean
  types: string[]
}

export interface NotificationIntegrationSettings {
  slack: SlackIntegrationSettings
  teams: TeamsIntegrationSettings
  webhook: WebhookIntegrationSettings
}

export interface SlackIntegrationSettings {
  enabled: boolean
  webhook_url: string
  channels: string[]
  events: string[]
  format: string
}

export interface TeamsIntegrationSettings {
  enabled: boolean
  webhook_url: string
  channels: string[]
  events: string[]
  format: string
}

export interface WebhookIntegrationSettings {
  enabled: boolean
  urls: string[]
  events: string[]
  format: string
  authentication: string
}

export interface IntegrationSettings {
  api: APIIntegrationSettings
  sso: SSOIntegrationSettings
  external: ExternalIntegrationSettings
  analytics: AnalyticsIntegrationSettings
}

export interface APIIntegrationSettings {
  enabled: boolean
  authentication: string
  rate_limiting: boolean
  documentation: string
  webhooks: boolean
}

export interface SSOIntegrationSettings {
  providers: SSOProvider[]
  auto_provision: boolean
  attribute_mapping: Record<string, string>
  group_sync: boolean
}

export interface SSOProvider {
  name: string
  type: 'saml' | 'oauth' | 'oidc'
  configuration: Record<string, any>
  enabled: boolean
}

export interface ExternalIntegrationSettings {
  cms: CMSIntegrationSettings
  helpdesk: HelpdeskIntegrationSettings
  crm: CRMIntegrationSettings
}

export interface CMSIntegrationSettings {
  enabled: boolean
  system: string
  sync: boolean
  direction: 'import' | 'export' | 'bidirectional'
  mapping: Record<string, string>
}

export interface HelpdeskIntegrationSettings {
  enabled: boolean
  system: string
  auto_link: boolean
  sync_status: boolean
  escalation: boolean
}

export interface CRMIntegrationSettings {
  enabled: boolean
  system: string
  customer_sync: boolean
  usage_tracking: boolean
  lead_scoring: boolean
}

export interface AnalyticsIntegrationSettings {
  google_analytics: GoogleAnalyticsSettings
  custom: CustomAnalyticsSettings
  data_export: DataExportSettings
}

export interface GoogleAnalyticsSettings {
  enabled: boolean
  tracking_id: string
  events: string[]
  dimensions: string[]
  goals: string[]
}

export interface CustomAnalyticsSettings {
  enabled: boolean
  endpoint: string
  events: string[]
  batch_size: number
  frequency: string
}

export interface DataExportSettings {
  enabled: boolean
  formats: string[]
  schedule: string
  destinations: string[]
  retention: number
}