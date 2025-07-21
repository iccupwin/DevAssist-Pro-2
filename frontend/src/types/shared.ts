/**
 * Shared Types между React Frontend и FastAPI Backend
 * Синхронизировано с backend/shared/schemas.py
 */

// ===== ENUMS =====
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ANALYSIS = 'analysis',
  EXECUTION = 'execution',
  COMPLETED = 'completed',
}

export enum DocumentType {
  TZ = 'tz',
  KP = 'kp',
  REPORT = 'report',
  OTHER = 'other',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ActivityType {
  DOCUMENT_UPLOADED = 'document_uploaded',
  ANALYSIS_STARTED = 'analysis_started',
  ANALYSIS_COMPLETED = 'analysis_completed',
  REPORT_GENERATED = 'report_generated',
  USER_REGISTERED = 'user_registered',
  PROJECT_CREATED = 'project_created',
  SETTINGS_UPDATED = 'settings_updated',
}

export enum OAuthProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  YANDEX = 'yandex',
}

// ===== BASE TYPES =====

// Generic metadata types
export interface DocumentMetadata {
  pages?: number;
  words?: number;
  characters?: number;
  language?: string;
  author?: string;
  title?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  format?: string;
  version?: string;
  [key: string]: unknown;
}

export interface AnalysisConfig {
  model_temperature?: number;
  max_tokens?: number;
  timeout_seconds?: number;
  custom_instructions?: string;
  evaluation_criteria?: string[];
  include_confidence_scores?: boolean;
  output_format?: 'json' | 'text' | 'structured';
  [key: string]: unknown;
}

export interface AnalysisResults {
  summary?: string;
  findings?: string[];
  recommendations?: string[];
  scores?: Record<string, number>;
  metadata?: Record<string, unknown>;
  raw_response?: string;
  [key: string]: unknown;
}

export interface ActivityMetadata {
  module?: string;
  action?: string;
  duration_ms?: number;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  additional_context?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GenerationConfig {
  template_id?: string;
  include_charts?: boolean;
  include_tables?: boolean;
  output_format?: 'pdf' | 'docx' | 'html';
  page_orientation?: 'portrait' | 'landscape';
  font_size?: number;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  [key: string]: unknown;
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  response_time_ms?: number;
  last_check?: string;
  error?: string;
  version?: string;
  dependencies?: ServiceStatus[];
}

export interface WebSocketData {
  progress?: number;
  status?: string;
  message?: string;
  result?: unknown;
  error?: string;
  [key: string]: unknown;
}

export interface DashboardLayoutConfig {
  grid_columns?: number;
  widget_order?: string[];
  hidden_widgets?: string[];
  widget_sizes?: Record<string, { width: number; height: number }>;
  theme_overrides?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OrganizationPermissions {
  organization_id: number;
  organization_name: string;
  role: UserRole;
  permissions: string[];
  is_active: boolean;
}

export interface BaseEntity {
  id: number | string;
  created_at: string;
  updated_at: string;
}

// ===== USER TYPES =====
export interface User extends BaseEntity {
  id: number;
  email: string;
  full_name: string;
  role: 'user' | 'superuser' | 'admin' | 'moderator';
  company?: string;
  position?: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  
  // Deprecated fields for backward compatibility
  name?: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
  is2FAEnabled?: boolean;
  avatar?: string;
  subscription?: {
    plan: string;
    status: 'active' | 'inactive' | 'cancelled';
    expiresAt: string;
  };
  preferences?: {
    language: string;
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  lastLoginAt?: string;
  organizations?: OrganizationMember[];
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  company?: string;
  phone?: string;
}

export interface UserUpdate {
  full_name?: string;
  company?: string;
  phone?: string;
}

export interface UserPasswordUpdate {
  current_password: string;
  new_password: string;
}

// ===== ORGANIZATION TYPES =====
export interface Organization extends BaseEntity {
  name: string;
  description?: string;
  website?: string;
  is_active: boolean;
  subscription_plan: string;
  monthly_ai_cost_limit: number;
  document_limit: number;
  members?: OrganizationMember[];
}

export interface OrganizationCreate {
  name: string;
  description?: string;
  website?: string;
}

export interface OrganizationUpdate {
  name?: string;
  description?: string;
  website?: string;
}

export interface OrganizationMember extends BaseEntity {
  user_id: number;
  organization_id: number;
  role: UserRole;
  is_active: boolean;
  user?: User;
  organization?: Organization;
}

// ===== PROJECT TYPES =====
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  project_type: string;
  status: ProjectStatus;
  owner_id: number;
  organization_id: number;
  owner?: User;
  organization?: Organization;
  documents?: Document[];
  analyses?: Analysis[];
}

export interface ProjectCreate {
  name: string;
  description?: string;
  project_type: string;
  organization_id: number;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

// ===== DOCUMENT TYPES =====
export interface Document extends BaseEntity {
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  document_type: DocumentType;
  file_path: string;
  s3_bucket?: string;
  s3_key?: string;
  is_processed: boolean;
  processed_at?: string;
  processing_status: string;
  extracted_text?: string;
  document_metadata?: DocumentMetadata;
  uploaded_by_id: number;
  project_id?: number;
  uploaded_by?: User;
  project?: Project;
}

export interface DocumentCreate {
  original_filename: string;
  document_type: DocumentType;
  project_id?: number;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  status: string;
  upload_path: string;
  created_at: string;
}

export interface DocumentContentResponse {
  document_id: string;
  content: string;
  content_type: string;
  character_count: number;
  extracted_at: string;
}

export interface DocumentAnalysisRequest {
  analysis_type?: string;
  custom_prompt?: string;
  context?: Record<string, unknown>;
}

export interface DocumentAnalysisResponse {
  document_id: string;
  analysis_type: string;
  analysis_result: AnalysisResults;
  confidence_score: number;
  processing_time: number;
  created_at: string;
}

// ===== ANALYSIS TYPES =====
export interface Analysis extends BaseEntity {
  analysis_type: string;
  ai_model: string;
  ai_provider: string;
  status: AnalysisStatus;
  project_id: number;
  tz_document_id?: number;
  analysis_config?: AnalysisConfig;
  results?: AnalysisResults;
  confidence_score?: number;
  processing_time?: number;
  ai_cost: number;
  tokens_used: number;
  project?: Project;
  tz_document?: Document;
}

export interface AnalysisCreate {
  analysis_type: string;
  ai_model: string;
  ai_provider: string;
  project_id: number;
  tz_document_id?: number;
  analysis_config?: AnalysisConfig;
}

export interface AnalysisDocument {
  id: number;
  analysis_id: number;
  document_id: number;
  compliance_score?: number;
  risk_score?: number;
  recommendation?: string;
  detailed_results?: AnalysisResults;
}

// ===== AI USAGE TYPES =====
export interface AIUsage extends BaseEntity {
  user_id: number;
  organization_id: number;
  ai_provider: string;
  ai_model: string;
  operation_type: string;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  response_time?: number;
  analysis_id?: number;
  user?: User;
  organization?: Organization;
}

// ===== REPORT TYPES =====
export interface Report extends BaseEntity {
  title: string;
  report_type: string;
  format: string;
  content?: string;
  file_path?: string;
  template_used?: string;
  ai_model?: string;
  generation_config?: GenerationConfig;
  analysis_id: number;
  generated_by_id: number;
  analysis?: Analysis;
  generated_by?: User;
}

// ===== ACTIVITY TYPES =====
export interface Activity extends BaseEntity {
  user_id: number;
  title: string;
  description?: string;
  organization_id?: number;
  module_id?: string;
  project_id?: number;
  document_id?: number;
  analysis_id?: number;
  user?: User;
  organization?: Organization;
  project?: Project;
  document?: Document;
  analysis?: Analysis;
  
  // Support both old and new field names for activity type
  activity_type?: string;
  type?: ActivityType;
  
  // Support both old and new metadata field names
  activity_metadata?: ActivityMetadata;
  project_metadata?: ActivityMetadata;
}

export interface ActivityFeedRequest {
  limit?: number;
  offset?: number;
  user_id?: number;
  organization_id?: number;
  project_id?: number;
  activity_type?: ActivityType;
  date_from?: string;
  date_to?: string;
}

export interface ActivityFeedResponse {
  activities: Activity[];
  total: number;
  has_more: boolean;
}

// ===== AUTHENTICATION TYPES =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  company?: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationConfirm {
  token: string;
}

export interface OAuthLoginRequest {
  provider: OAuthProvider;
  code: string;
  redirect_uri?: string;
}

export interface OAuthUserInfo {
  email: string;
  name: string;
  picture?: string;
  provider: string;
}

// ===== API RESPONSE TYPES =====
export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface UserPermissions {
  is_superuser: boolean;
  organizations: OrganizationPermissions[];
  global_permissions: string[];
}

export interface TokenPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  type?: string;
  jti?: string;
}

// ===== HEALTH CHECK TYPES =====
export interface HealthCheck {
  status: string;
  timestamp: string;
  version: string;
  services: Record<string, ServiceStatus>;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
}

// ===== WEBSOCKET TYPES =====
export interface WebSocketMessage {
  type: string;
  data: WebSocketData;
  timestamp: string;
}

export interface WebSocketError {
  type: 'error';
  error: string;
  details?: Record<string, unknown>;
}

export interface WebSocketEvent {
  type: 'analysis_progress' | 'analysis_complete' | 'document_processed' | 'notification';
  data: WebSocketData;
  timestamp: string;
}

// ===== DASHBOARD TYPES =====
export interface DashboardStats {
  total_projects: number;
  total_documents: number;
  total_analyses: number;
  ai_cost_this_month: number;
  recent_activities: Activity[];
}

export interface DashboardModule extends BaseEntity {
  id: string; // kp-analyzer, tz-generator, etc.
  title: string;
  description: string;
  icon: string;
  status: 'active' | 'coming_soon' | 'beta';
  ai_models: string[];
  is_enabled: boolean;
  sort_order: number;
  access_level: 'public' | 'premium' | 'enterprise';
  settings?: Record<string, unknown>;
}

export interface UserActivity extends BaseEntity {
  user_id: number;
  organization_id?: number;
  activity_type: string;
  title: string;
  description?: string;
  module_id?: string;
  project_id?: number;
  document_id?: number;
  analysis_id?: number;
  activity_metadata?: ActivityMetadata;
  user?: User;
  organization?: Organization;
  project?: Project;
  document?: Document;
  analysis?: Analysis;
}

export interface Notification extends BaseEntity {
  user_id: number;
  organization_id?: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  is_read: boolean;
  is_deleted: boolean;
  expires_at?: string;
  action_url?: string;
  action_text?: string;
  module_id?: string;
  project_id?: number;
  user?: User;
  organization?: Organization;
  project?: Project;
}

export interface DashboardPreference extends BaseEntity {
  user_id: number;
  theme: 'light' | 'dark' | 'auto';
  language: 'ru' | 'en';
  show_welcome_tour: boolean;
  default_module?: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  dashboard_layout?: DashboardLayoutConfig;
  favorite_modules?: string[];
  user?: User;
}

export interface SystemMetric extends BaseEntity {
  metric_type: string;
  metric_name: string;
  value: number;
  previous_value?: number;
  organization_id?: number;
  module_id?: string;
  measured_at: string;
  period: 'hour' | 'day' | 'week' | 'month';
  organization?: Organization;
}

export interface SearchIndex extends BaseEntity {
  object_type: 'project' | 'document' | 'analysis' | 'user';
  object_id: number;
  title: string;
  content: string;
  description?: string;
  module_id?: string;
  project_id?: number;
  organization_id?: number;
  user_id?: number;
  relevance_boost: number;
  last_accessed?: string;
  access_count: number;
  organization?: Organization;
  user?: User;
}


// ===== KP ANALYZER SPECIFIC TYPES =====
export interface KPAnalysisRequest {
  project_id: number;
  tz_document_id: number;
  kp_document_ids: number[];
  ai_model: string;
  ai_provider: string;
  analysis_config?: {
    evaluation_criteria?: string[];
    custom_prompts?: Record<string, string>;
    comparison_mode?: 'detailed' | 'quick';
  };
}

export interface KPAnalysisResult {
  analysis_id: number;
  project_id: number;
  tz_document_id: number;
  overall_results: {
    total_kp_analyzed: number;
    average_compliance_score: number;
    recommended_supplier: string;
    total_cost: number;
    processing_time: number;
  };
  kp_results: Array<{
    document_id: number;
    document_name: string;
    compliance_score: number;
    risk_score: number;
    recommendation: string;
    detailed_analysis: AnalysisResults;
    cost_analysis: {
      total_cost: number;
      cost_breakdown: Record<string, number>;
    };
  }>;
  comparison_matrix: Record<string, unknown>;
  recommendations: string[];
  created_at: string;
}

// ===== TYPE GUARDS =====
export function isUser(obj: unknown): obj is User {
  return obj !== null && typeof obj === 'object' && 'id' in obj && 'email' in obj && 
    typeof (obj as User).id === 'number' && typeof (obj as User).email === 'string';
}

export function isProject(obj: unknown): obj is Project {
  return obj !== null && typeof obj === 'object' && 'id' in obj && 'name' in obj &&
    typeof (obj as Project).id === 'number' && typeof (obj as Project).name === 'string';
}

export function isDocument(obj: unknown): obj is Document {
  return obj !== null && typeof obj === 'object' && 'id' in obj && 'filename' in obj &&
    typeof (obj as Document).id === 'number' && typeof (obj as Document).filename === 'string';
}

export function isAnalysis(obj: unknown): obj is Analysis {
  return obj !== null && typeof obj === 'object' && 'id' in obj && 'analysis_type' in obj &&
    typeof (obj as Analysis).id === 'number' && typeof (obj as Analysis).analysis_type === 'string';
}

// ===== FORM VALIDATION TYPES =====
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

export interface FormValidationRules {
  [key: string]: ValidationRule;
}

export interface FormErrors {
  [key: string]: string;
}

// ===== FILE UPLOAD TYPES =====
export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  documentId?: number;
}

export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  onProgress?: (progress: FileUploadProgress) => void;
}

// Named export object for backwards compatibility
export const SharedTypesDefault = {
  UserRole,
  ProjectStatus,
  DocumentType,
  AnalysisStatus,
  OAuthProvider,
};

// Default export for backwards compatibility
export default SharedTypesDefault;