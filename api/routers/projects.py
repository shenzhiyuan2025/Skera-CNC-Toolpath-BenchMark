from fastapi import APIRouter, HTTPException
from typing import List, Optional
from uuid import UUID
from api.models import Project, ProjectCreate, ProjectSettings, ProjectSettingsCreate
from api.config import supabase

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/", response_model=List[Project])
async def get_projects():
    # In a real app, filter by user_id
    response = supabase.table("projects").select("*").execute()
    return response.data

@router.post("/", response_model=Project)
async def create_project(project: ProjectCreate):
    # In a real app, get user_id from auth context
    project_data = project.model_dump(mode='json')
    # Mock user_id for now or require it in request
    # project_data['user_id'] = str(current_user.id) 
    
    response = supabase.table("projects").insert(project_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create project")
    return response.data[0]

@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: UUID):
    response = supabase.table("projects").select("*").eq("id", str(project_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return response.data[0]

@router.get("/{project_id}/settings", response_model=Optional[ProjectSettings])
async def get_project_settings(project_id: UUID):
    response = supabase.table("project_settings").select("*").eq("project_id", str(project_id)).execute()
    if not response.data:
        return None
    return response.data[0]

@router.post("/{project_id}/settings", response_model=ProjectSettings)
async def update_project_settings(project_id: UUID, settings: ProjectSettingsCreate):
    settings_data = settings.model_dump(mode='json')
    settings_data['project_id'] = str(project_id)
    
    # Check if exists
    existing = await get_project_settings(project_id)
    
    if existing:
        response = supabase.table("project_settings").update(settings_data).eq("project_id", str(project_id)).execute()
    else:
        response = supabase.table("project_settings").insert(settings_data).execute()
        
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to save settings")
    return response.data[0]
