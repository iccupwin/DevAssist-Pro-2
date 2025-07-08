"""
Pydantic схемы для DevAssist Pro
"""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ANALYSIS = "analysis"
    EXECUTION = "execution"
    COMPLETED = "completed"

class DocumentType(str, Enum):
    TZ = "tz"
    KP = "kp"
    REPORT = "report"
    OTHER = "other"

class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseSchema):
    email: EmailStr
    full_name: str
    company: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Пароль должен содержать минимум 8 символов')
        return v

class UserUpdate(BaseSchema):
    full_name: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None

class UserPasswordUpdate(BaseSchema):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Пароль должен содержать минимум 8 символов')
        return v

class User(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

class UserWithOrganizations(User):
    organizations: List['OrganizationMember'] = []

# Organization schemas
class OrganizationBase(BaseSchema):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None

class Organization(OrganizationBase):
    id: int
    is_active: bool
    subscription_plan: str
    monthly_ai_cost_limit: float
    document_limit: int
    created_at: datetime
    updated_at: datetime

class OrganizationWithMembers(Organization):
    members: List['OrganizationMember'] = []

# Organization Member schemas
class OrganizationMemberBase(BaseSchema):
    role: UserRole

class OrganizationMemberCreate(OrganizationMemberBase):
    user_id: int
    organization_id: int

class OrganizationMemberUpdate(BaseSchema):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class OrganizationMember(OrganizationMemberBase):
    id: int
    user_id: int
    organization_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    user: Optional[User] = None
    organization: Optional[Organization] = None

# Authentication schemas
class LoginRequest(BaseSchema):
    email: EmailStr
    password: str

class LoginResponse(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: User

class RefreshTokenRequest(BaseSchema):
    refresh_token: str

class RefreshTokenResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class LogoutRequest(BaseSchema):
    refresh_token: str

class PasswordResetRequest(BaseSchema):
    email: EmailStr

class PasswordResetConfirm(BaseSchema):
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Пароль должен содержать минимум 8 символов')
        return v

class EmailVerificationRequest(BaseSchema):
    email: EmailStr

class EmailVerificationConfirm(BaseSchema):
    token: str

# OAuth schemas
class OAuthProvider(str, Enum):
    GOOGLE = "google"
    MICROSOFT = "microsoft"
    YANDEX = "yandex"

class OAuthLoginRequest(BaseSchema):
    provider: OAuthProvider
    code: str
    redirect_uri: Optional[str] = None

class OAuthUserInfo(BaseSchema):
    email: str
    name: str
    picture: Optional[str] = None
    provider: str

# Project schemas
class ProjectBase(BaseSchema):
    name: str
    description: Optional[str] = None
    project_type: str
    status: ProjectStatus = ProjectStatus.PLANNING

class ProjectCreate(ProjectBase):
    organization_id: int

class ProjectUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None

class Project(ProjectBase):
    id: int
    owner_id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime
    owner: Optional[User] = None
    organization: Optional[Organization] = None

# Document schemas для КП Анализатора
class DocumentBase(BaseSchema):
    original_filename: str
    document_type: DocumentType

class DocumentCreate(DocumentBase):
    project_id: Optional[int] = None

class DocumentUploadResponse(BaseSchema):
    document_id: str
    filename: str
    file_size: int
    file_type: str
    status: str
    upload_path: str
    created_at: datetime

class DocumentContentResponse(BaseSchema):
    document_id: str
    content: str
    content_type: str
    character_count: int
    extracted_at: datetime

class DocumentListResponse(BaseSchema):
    documents: List[Dict[str, Any]]
    total: int
    limit: int
    offset: int

class DocumentAnalysisRequest(BaseSchema):
    analysis_type: str = "summary"
    custom_prompt: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class DocumentAnalysisResponse(BaseSchema):
    document_id: str
    analysis_type: str
    analysis_result: Dict[str, Any]
    confidence_score: float
    processing_time: float
    created_at: datetime

class Document(DocumentBase):
    id: int
    filename: str
    file_size: int
    file_type: str
    file_path: str
    is_processed: bool
    processing_status: str
    uploaded_by_id: int
    project_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    uploaded_by: Optional[User] = None
    project: Optional[Project] = None

# Analysis schemas
class AnalysisBase(BaseSchema):
    analysis_type: str
    ai_model: str
    ai_provider: str

class AnalysisCreate(AnalysisBase):
    project_id: int
    tz_document_id: Optional[int] = None
    analysis_config: Optional[Dict[str, Any]] = None

class Analysis(AnalysisBase):
    id: int
    project_id: int
    tz_document_id: Optional[int] = None
    status: AnalysisStatus
    results: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None
    processing_time: Optional[float] = None
    ai_cost: float
    tokens_used: int
    created_at: datetime
    updated_at: datetime
    project: Optional[Project] = None
    tz_document: Optional[Document] = None

# API Response schemas
class APIResponse(BaseSchema):
    success: bool
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseSchema):
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None

class PaginationParams(BaseSchema):
    page: int = 1
    size: int = 20
    
    @validator('page')
    def validate_page(cls, v):
        if v < 1:
            raise ValueError('Номер страницы должен быть больше 0')
        return v
    
    @validator('size')
    def validate_size(cls, v):
        if v < 1 or v > 100:
            raise ValueError('Размер страницы должен быть от 1 до 100')
        return v

class PaginatedResponse(BaseSchema):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int

# User permissions schema
class UserPermissions(BaseSchema):
    is_superuser: bool
    organizations: List[Dict[str, Any]]
    global_permissions: List[str]

# Token payload schema
class TokenPayload(BaseSchema):
    sub: Optional[str] = None  # user_id
    exp: Optional[int] = None
    iat: Optional[int] = None
    type: Optional[str] = None
    jti: Optional[str] = None

# Health check schemas
class HealthCheck(BaseSchema):
    status: str
    timestamp: datetime
    version: str
    services: Dict[str, Any]

class HealthResponse(BaseSchema):
    status: str
    service: str
    version: str
    uptime: float
    timestamp: datetime

# Forward references update
UserWithOrganizations.model_rebuild()
OrganizationWithMembers.model_rebuild()