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
export interface BaseEntity {
  id: number | string;
  created_at: string;
  updated_at: string;
}

// ===== USER TYPES =====
export interface User extends BaseEntity {
  email: string;
  full_name: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'moderator';
  company?: string;
  position?: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
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
  position?: string;
  phone?: string;
}

export interface UserUpdate {
  full_name?: string;
  company?: string;
  position?: string;
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
  metadata?: Record<string, any>;
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
  context?: Record<string, any>;
}

export interface DocumentAnalysisResponse {
  document_id: string;
  analysis_type: string;
  analysis_result: Record<string, any>;
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
  analysis_config?: Record<string, any>;
  results?: Record<string, any>;
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
  analysis_config?: Record<string, any>;
}

export interface AnalysisDocument {
  id: number;
  analysis_id: number;
  document_id: number;
  compliance_score?: number;
  risk_score?: number;
  recommendation?: string;
  detailed_results?: Record<string, any>;
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
  generation_config?: Record<string, any>;
  analysis_id: number;
  generated_by_id: number;
  analysis?: Analysis;
  generated_by?: User;
}

// ===== ACTIVITY TYPES =====
export interface Activity extends BaseEntity {
  type: ActivityType;
  title: string;
  description: string;
  user_id: number;
  organization_id?: number;
  project_id?: number;
  document_id?: number;
  analysis_id?: number;
  project_metadata?: Record<string, any>;
  user?: User;
  organization?: Organization;
  project?: Project;
  document?: Document;
  analysis?: Analysis;
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
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: Record<string, any>;
}

export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface UserPermissions {
  is_superuser: boolean;
  organizations: Array<Record<string, any>>;
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
  services: Record<string, any>;
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
  data: any;
  timestamp: string;
}

export interface WebSocketError {
  type: 'error';
  error: string;
  details?: Record<string, any>;
}

export interface WebSocketEvent {
  type: 'analysis_progress' | 'analysis_complete' | 'document_processed' | 'notification';
  data: any;
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
    detailed_analysis: Record<string, any>;
    cost_analysis: {
      total_cost: number;
      cost_breakdown: Record<string, number>;
    };
  }>;
  comparison_matrix: Record<string, any>;
  recommendations: string[];
  created_at: string;
}

// ===== TYPE GUARDS =====
export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'number' && typeof obj.email === 'string';
}

export function isProject(obj: any): obj is Project {
  return obj && typeof obj.id === 'number' && typeof obj.name === 'string';
}

export function isDocument(obj: any): obj is Document {
  return obj && typeof obj.id === 'number' && typeof obj.filename === 'string';
}

export function isAnalysis(obj: any): obj is Analysis {
  return obj && typeof obj.id === 'number' && typeof obj.analysis_type === 'string';
}

// ===== FORM VALIDATION TYPES =====
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
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

export default {
  UserRole,
  ProjectStatus,
  DocumentType,
  AnalysisStatus,
  OAuthProvider,
};