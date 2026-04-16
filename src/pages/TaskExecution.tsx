import React, { useEffect, useState } from 'react';
import { Plus, Clock, CheckCircle, AlertCircle, Play, MoreHorizontal, Calendar, Filter, ArrowUpRight } from 'lucide-react';
import { getTasks, createTask } from '../lib/api';

const TaskExecution: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    description: '',
    priority: 'medium',
    deadline: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData = {
        ...newTask,
        team_id: "00000000-0000-0000-0000-000000000000"
      };
      await createTask(taskData);
      setIsModalOpen(false);
      fetchTasks();
      setNewTask({ description: '', priority: 'medium', deadline: '' });
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-slate-100 text-slate-600 border-slate-200",
      running: "bg-blue-50 text-blue-700 border-blue-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      failed: "bg-red-50 text-red-700 border-red-200"
    };
    
    const icons = {
      pending: <Clock size={12} />,
      running: <Play size={12} />,
      completed: <CheckCircle size={12} />,
      failed: <AlertCircle size={12} />
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${styles[status as keyof typeof styles] || styles.pending}`}>
        {icons[status as keyof typeof icons]}
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: "text-red-600 bg-red-50 border-red-100",
      medium: "text-amber-600 bg-amber-50 border-amber-100",
      low: "text-green-600 bg-green-50 border-green-100"
    };
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded border capitalize ${styles[priority as keyof typeof styles]}`}>
        {priority}
      </span>
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor and orchestrate your agent tasks</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <Filter size={18} />
            Filter
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            <Plus size={18} />
            New Task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500">Loading tasks...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Description</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Priority</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Created At</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                      <p className="text-slate-500 mt-1 mb-4">There are no pending tasks at the moment.</p>
                      <button onClick={() => setIsModalOpen(true)} className="text-blue-600 font-medium hover:underline">
                        Create a new task
                      </button>
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 rounded text-blue-600 mt-0.5">
                            <ArrowUpRight size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 line-clamp-1 mb-0.5">{task.description}</div>
                            <div className="text-xs text-slate-500 font-mono">ID: {task.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(task.status)}
                      </td>
                      <td className="px-6 py-4">
                        {getPriorityBadge(task.priority)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(task.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
             <span>Showing {tasks.length} tasks</span>
             <div className="flex gap-2">
               <button className="disabled:opacity-50 hover:text-slate-800" disabled>Previous</button>
               <button className="disabled:opacity-50 hover:text-slate-800" disabled>Next</button>
             </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Create New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Task Description</label>
                <textarea
                  required
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="input-field min-h-[120px]"
                  rows={4}
                  placeholder="Describe what needs to be done in detail..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="input-field appearance-none bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deadline</label>
                  <input
                    type="datetime-local"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="input-field"
                  />
                </div>
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
                  Submit Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskExecution;
