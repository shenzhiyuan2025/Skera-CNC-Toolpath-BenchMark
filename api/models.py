from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

# User Models
class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: UUID
    plan: str
    created_at: datetime
    updated_at: datetime

# Project Models
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    prompt: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: UUID
    user_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

# Model Models
class ModelBase(BaseModel):
    prompt: str
    style: Optional[str] = "Low Poly"
    
class ModelCreate(ModelBase):
    project_id: UUID

class Model(ModelBase):
    id: UUID
    project_id: UUID
    file_url: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime

# Variant Models
class VariantBase(BaseModel):
    variant_number: int
    file_url: str
    parameters: Dict[str, Any] = {}
    is_selected: bool = False

class Variant(VariantBase):
    id: UUID
    model_id: UUID

# Project Settings Models
class ProjectSettingsBase(BaseModel):
    material: str
    stock_size: Dict[str, float]
    strategy: str
    preferences: Dict[str, Any] = {}

class ProjectSettingsCreate(ProjectSettingsBase):
    project_id: UUID

class ProjectSettings(ProjectSettingsBase):
    id: UUID
    project_id: UUID
    updated_at: datetime

# Machining Job Models
class MachiningJobBase(BaseModel):
    status: str
    estimated_time: Optional[int] = None
    parameters: Dict[str, Any] = {}

class MachiningJob(MachiningJobBase):
    id: UUID
    project_id: UUID
    toolpath_url: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
