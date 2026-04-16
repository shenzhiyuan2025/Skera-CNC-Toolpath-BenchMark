import React, { useEffect, useState } from 'react';
import { Plus, User, Code, CheckCircle, Monitor, Sparkles, Zap, Brain, Command } from 'lucide-react';
import { getAgents, createAgent } from '../lib/api';

const Workbench: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    role: 'coder',
    skills: '',
    prompt_template: ''
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (error) {
      console.error('Failed to fetch agents', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const agentData = {
        ...newAgent,
        user_id: "00000000-0000-0000-0000-000000000000", 
        skills: newAgent.skills.split(',').map(s => s.trim())
      };
      await createAgent(agentData);
      setIsModalOpen(false);
      fetchAgents();
      setNewAgent({ name: '', role: 'coder', skills: '', prompt_template: '' });
    } catch (error) {
      console.error('Failed to create agent', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'coder': return <Code className="w-5 h-5 text-blue-600" />;
      case 'reviewer': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'manager': return <Monitor className="w-5 h-5 text-purple-600" />;
      default: return <User className="w-5 h-5 text-slate-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'coder': return "bg-blue-50 text-blue-700 border-blue-100";
      case 'reviewer': return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case 'manager': return "bg-purple-50 text-purple-700 border-purple-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div>
      {/* Stats / Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 font-medium mb-1">Total Agents</p>
              <h3 className="text-3xl font-bold">{agents.length}</h3>
            </div>
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <BotIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-100">
            <span className="flex items-center gap-1"><Zap size={14} /> Active</span>
            <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
            <span>Ready for tasks</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center hover:border-blue-300 transition-colors cursor-pointer group" onClick={() => setIsModalOpen(true)}>
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Deploy New Agent</h3>
          <p className="text-sm text-slate-500">Add a specialized AI to your team</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
           <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-amber-500" /> 
             Recommended Skills
           </h4>
           <div className="flex flex-wrap gap-2">
             {['Python', 'React', 'Code Review', 'Project Management', 'SQL', 'Testing'].map(skill => (
               <span key={skill} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md hover:bg-slate-200 transition-colors cursor-default">
                 {skill}
               </span>
             ))}
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Your Agent Workforce</h2>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search agents..." 
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No agents deployed yet</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">Create your first intelligent agent to start automating your workflow.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 btn-primary mx-auto"
              >
                <Plus size={18} />
                Create First Agent
              </button>
            </div>
          ) : (
            agents.map((agent) => (
              <div key={agent.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  agent.role === 'coder' ? 'bg-blue-500' : 
                  agent.role === 'reviewer' ? 'bg-emerald-500' : 'bg-purple-500'
                }`}></div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        agent.role === 'coder' ? 'bg-blue-50 text-blue-600' : 
                        agent.role === 'reviewer' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {getRoleIcon(agent.role)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{agent.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded border capitalize ${getRoleColor(agent.role)}`}>
                          {agent.role}
                        </span>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontalIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Brain size={12} />
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.skills.map((skill: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-medium border border-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Idle
                  </div>
                  <button className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BotIcon className="w-5 h-5 text-blue-600" />
                New Agent
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Agent Name</label>
                <input
                  type="text"
                  required
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Backend Architect"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {['coder', 'reviewer', 'manager'].map((role) => (
                    <div 
                      key={role}
                      onClick={() => setNewAgent({ ...newAgent, role })}
                      className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${
                        newAgent.role === role 
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="mx-auto mb-1">
                        {getRoleIcon(role)}
                      </div>
                      <span className="text-xs font-medium capitalize block">{role}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Skills</label>
                <input
                  type="text"
                  value={newAgent.skills}
                  onChange={(e) => setNewAgent({ ...newAgent, skills: e.target.value })}
                  className="input-field"
                  placeholder="Python, FastAPI, SQL (comma separated)"
                />
                <p className="text-xs text-slate-500 mt-1">Separate multiple skills with commas</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">System Prompt</label>
                <textarea
                  value={newAgent.prompt_template}
                  onChange={(e) => setNewAgent({ ...newAgent, prompt_template: e.target.value })}
                  className="input-field min-h-[100px]"
                  placeholder="Define the agent's personality and constraints..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper icons
const BotIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);

const MoreHorizontalIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default Workbench;
