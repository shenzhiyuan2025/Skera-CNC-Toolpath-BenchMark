import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for frontend (using anon key)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mhchjlqeixlamlufqdjq.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oY2hqbHFlaXhsYW1sdWZxZGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjAwNzksImV4cCI6MjA4ODY5NjA3OX0.AyJEoQ0vA8E_l-y0n9oiaHKcx7okjDIxTXwtgfVpp1Q';

export const supabase = createClient(supabaseUrl, supabaseKey);

const API_BASE_URL = 'http://localhost:8000';

export async function getAgents() {
  const response = await fetch(`${API_BASE_URL}/agents/`);
  if (!response.ok) throw new Error('Failed to fetch agents');
  return response.json();
}

export async function createAgent(agent: any) {
  const response = await fetch(`${API_BASE_URL}/agents/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agent),
  });
  if (!response.ok) throw new Error('Failed to create agent');
  return response.json();
}

export async function getTasks() {
  const response = await fetch(`${API_BASE_URL}/tasks/`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function createTask(task: any) {
  const response = await fetch(`${API_BASE_URL}/tasks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
}
