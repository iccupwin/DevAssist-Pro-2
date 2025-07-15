/**
 * API Types для unified интеграции
 * Совместимость между React frontend и FastAPI backend
 */

import { User, Project, Document, Analysis, Organization } from './shared';

// ===== GENERIC API TYPES =====
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, any>;
  code?: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ===== HTTP CLIENT TYPES =====
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
}

export interface RequestOptions {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// ===== AUTHENTICATION API =====
export interface AuthApiResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuthError {
  error: string;
  error_description?: string;
}

// ===== PROJECTS API =====
export interface ProjectsApiResponse {
  projects: Project[];
  total: number;
  page: number;
  size: number;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
  project_type: string;
  organization_id: number;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  status?: string;
}

// ===== DOCUMENTS API =====
export interface DocumentsApiResponse {
  documents: Document[];
  total: number;
  page: number;
  size: number;
}

export interface DocumentUploadRequest {
  file: File;
  document_type: string;
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

export interface DocumentProcessingStatus {
  document_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  processed_at?: string;
}

// ===== ANALYSIS API =====
export interface AnalysisApiResponse {
  analyses: Analysis[];
  total: number;
  page: number;
  size: number;
}

export interface AnalysisCreateRequest {
  analysis_type: string;
  ai_model: string;
  ai_provider: string;
  project_id: number;
  tz_document_id?: number;
  analysis_config?: Record<string, any>;
}

export interface AnalysisProgress {
  analysis_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  estimated_time?: number;
  error?: string;
}

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

export interface KPAnalysisResponse {
  analysis_id: number;
  project_id: number;
  status: string;
  results: {
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
  };
  created_at: string;
}

// ===== DASHBOARD API =====
export interface DashboardStatsResponse {
  total_projects: number;
  total_documents: number;
  total_analyses: number;
  ai_cost_this_month: number;
  recent_activities: Array<{
    id: number;
    type: string;
    description: string;
    created_at: string;
    user_id?: number;
    project_id?: number;
  }>;
}

export interface UserActivity {
  id: number;
  type: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// ===== WEBSOCKET API =====
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  id?: string;
}

export interface WebSocketEvent {
  type: 'analysis_progress' | 'analysis_complete' | 'document_processed' | 'notification' | 'error';
  data: any;
}

export interface WebSocketConnectionOptions {
  url: string;
  token: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

// ===== FILE UPLOAD API =====
export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  file: File;
}

export interface FileUploadOptions {
  onProgress?: (progress: FileUploadProgress) => void;
  onSuccess?: (response: DocumentUploadResponse) => void;
  onError?: (error: ApiError) => void;
  maxSize?: number;
  allowedTypes?: string[];
}

export interface BatchUploadRequest {
  files: File[];
  document_type: string;
  project_id?: number;
}

export interface BatchUploadResponse {
  uploads: Array<{
    filename: string;
    document_id?: string;
    status: 'success' | 'error';
    error?: string;
  }>;
  total: number;
  successful: number;
  failed: number;
}

// ===== ORGANIZATIONS API =====
export interface OrganizationsApiResponse {
  organizations: Organization[];
  total: number;
  page: number;
  size: number;
}

export interface OrganizationCreateRequest {
  name: string;
  description?: string;
  website?: string;
}

export interface OrganizationUpdateRequest {
  name?: string;
  description?: string;
  website?: string;
}

// ===== USERS API =====
export interface UsersApiResponse {
  users: User[];
  total: number;
  page: number;
  size: number;
}

export interface UserUpdateRequest {
  full_name?: string;
  company?: string;
  position?: string;
  phone?: string;
}

export interface UserPasswordUpdateRequest {
  current_password: string;
  new_password: string;
}

// ===== HEALTH CHECK API =====
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  services: {
    database: { status: string; response_time: number };
    redis: { status: string; response_time: number };
    ai_services: { status: string; providers: string[] };
  };
}

// ===== SEARCH API =====
export interface SearchParams {
  query: string;
  type?: 'projects' | 'documents' | 'analyses' | 'all';
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  description: string;
  score: number;
  metadata: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  took: number;
}

// ===== NOTIFICATIONS API =====
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  total: number;
}

// ===== EXPORT API =====
export interface ExportRequest {
  type: 'pdf' | 'excel' | 'csv';
  data_type: 'analysis' | 'project' | 'documents';
  ids: number[];
  options?: Record<string, any>;
}

export interface ExportResponse {
  export_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  expires_at?: string;
}

// ===== ANALYTICS API =====
export interface AnalyticsQuery {
  metric: string;
  timeframe: 'day' | 'week' | 'month' | 'year';
  start_date?: string;
  end_date?: string;
  filters?: Record<string, any>;
}

export interface AnalyticsResponse {
  metric: string;
  data: Array<{
    date: string;
    value: number;
  }>;
  summary: {
    total: number;
    average: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
}

// ===== TYPE GUARDS =====
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj && typeof obj.success === 'boolean';
}

export function isApiError(obj: any): obj is ApiError {
  return obj && obj.success === false && typeof obj.error === 'string';
}

export function isPaginatedResponse<T>(obj: any): obj is PaginatedResponse<T> {
  return obj && Array.isArray(obj.items) && typeof obj.total === 'number';
}

export function isWebSocketMessage(obj: any): obj is WebSocketMessage {
  return obj && typeof obj.type === 'string' && obj.data !== undefined;
}

// ===== UTILITY TYPES =====
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ApiEndpoint = 
  | '/api/auth/login'
  | '/api/auth/register'
  | '/api/auth/logout'
  | '/api/auth/refresh'
  | '/api/auth/forgot-password'
  | '/api/auth/reset-password'
  | '/api/auth/oauth/login'
  | '/api/users/me'
  | '/api/projects'
  | '/api/documents'
  | '/api/documents/upload'
  | '/api/analyses'
  | '/api/analyses/kp-analysis'
  | '/api/dashboard/stats'
  | '/api/organizations'
  | '/api/notifications'
  | '/api/search'
  | '/api/export'
  | '/api/analytics'
  | '/health'
  | '/ws';

export type HttpStatus = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 422 | 500;

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

export default {
  isApiResponse,
  isApiError,
  isPaginatedResponse,
  isWebSocketMessage,
};