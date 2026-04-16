from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID
from api.models import Agent, AgentCreate
from api.config import supabase

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("/", response_model=List[Agent])
async def get_agents():
    response = supabase.table("agents").select("*").execute()
    return response.data

@router.post("/", response_model=Agent)
async def create_agent(agent: AgentCreate):
    agent_data = agent.model_dump(mode='json')
    response = supabase.table("agents").insert(agent_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create agent")
    return response.data[0]

@router.get("/{agent_id}", response_model=Agent)
async def get_agent(agent_id: UUID):
    response = supabase.table("agents").select("*").eq("id", str(agent_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    return response.data[0]

@router.put("/{agent_id}", response_model=Agent)
async def update_agent(agent_id: UUID, agent: AgentCreate):
    agent_data = agent.model_dump(mode='json', exclude={"user_id"}) # Don't update user_id
    response = supabase.table("agents").update(agent_data).eq("id", str(agent_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    return response.data[0]

@router.delete("/{agent_id}")
async def delete_agent(agent_id: UUID):
    response = supabase.table("agents").delete().eq("id", str(agent_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted successfully"}
