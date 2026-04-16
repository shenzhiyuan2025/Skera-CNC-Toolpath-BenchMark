from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from typing import List
from uuid import UUID
from api.models import Task, TaskCreate, Message
from api.config import supabase
import json

router = APIRouter(prefix="/tasks", tags=["tasks"])

# Simple in-memory connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.get("/", response_model=List[Task])
async def get_tasks():
    response = supabase.table("tasks").select("*").execute()
    return response.data

@router.post("/", response_model=Task)
async def create_task(task: TaskCreate):
    task_data = task.model_dump(mode='json')
    response = supabase.table("tasks").insert(task_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create task")
    
    # Trigger agent orchestration (mock for now)
    # In a real scenario, this would call LangGraph
    
    return response.data[0]

@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: UUID):
    response = supabase.table("tasks").select("*").eq("id", str(task_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return response.data[0]

@router.get("/{task_id}/messages", response_model=List[Message])
async def get_task_messages(task_id: UUID):
    response = supabase.table("messages").select("*").eq("task_id", str(task_id)).order("timestamp").execute()
    return response.data

@router.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now
            await manager.broadcast(f"Message received for task {task_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
