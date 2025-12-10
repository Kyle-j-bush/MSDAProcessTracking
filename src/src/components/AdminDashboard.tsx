import React, { useEffect, useState } from 'react';
import { api, Process } from '../api';
import { PlusCircle, Loader2, Trash2 } from 'lucide-react';

// ... (in AdminDashboard component)

export const AdminDashboard: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    const [processes, setProcesses] = useState<Process[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', description: '', category: 'general', estimated_duration: 0 });
    const [submitting, setSubmitting] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === 'root') {
            setIsAuthenticated(true);
        } else {
            alert('Incorrect password');
        }
    };

    const fetchProcesses = async () => {
        try {
            const data = await api.getProcesses();
            setProcesses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchProcesses();
        }
    }, [isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const newProcess = await api.createProcess(formData);
            setProcesses(prev => [...prev, newProcess]); // Instant update
            setFormData({ name: '', description: '', category: 'general', estimated_duration: 0 });
            // Do not re-fetch to avoid eventual consistency lag
        } catch (error) {
            alert('Failed to create process');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this process?')) return;
        setProcesses(prev => prev.filter(p => p.id !== id)); // Optimistic delete
        try {
            await api.deleteProcess(id);
        } catch (error) {
            alert('Failed to delete process');
            fetchProcesses(); // Revert on error
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Access</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 border"
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-primary w-full"
                        >
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Process Definitions</h1>

            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <PlusCircle className="w-6 h-6 text-brand-green" />
                    Add New Process
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Process Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 border"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 border"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 border"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Est. Duration (min)</label>
                            <input
                                type="number"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 border"
                                value={formData.estimated_duration}
                                onChange={e => setFormData({ ...formData, estimated_duration: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full flex justify-center items-center gap-2"
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : 'Create Definition'}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <h2 className="text-xl font-semibold p-6 bg-gray-50 border-b">Existing Processes</h2>
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {processes.map(proc => (
                            <li key={proc.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{proc.name}</h3>
                                        <p className="text-sm text-gray-500">{proc.description}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-primary">
                                            {proc.category}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(proc.id)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                            title="Delete Process"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {processes.length === 0 && (
                            <li className="p-8 text-center text-gray-500">No processes defined yet.</li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};
