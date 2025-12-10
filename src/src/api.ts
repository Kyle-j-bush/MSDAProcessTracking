export interface Process {
    id: string;
    name: string;
    description: string;
    category: string;
    estimated_duration: number;
}

export interface WorkLog {
    id: string;
    person_name: string;
    process_id: string;
    start_timestamp: string;
    end_timestamp?: string;
    duration?: number;
    status: 'RUNNING' | 'COMPLETED';
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = {
    getProcesses: async (): Promise<Process[]> => {
        const res = await fetch(`${API_BASE}/processes`);
        if (!res.ok) throw new Error('Failed to fetch processes');
        return res.json();
    },

    createProcess: async (process: Partial<Process>): Promise<Process> => {
        const res = await fetch(`${API_BASE}/processes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(process),
        });
        if (!res.ok) throw new Error('Failed to create process');
        return res.json();
    },

    startWork: async (personName: string, processId: string, processName: string): Promise<WorkLog> => {
        const res = await fetch(`${API_BASE}/work-log/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ person_name: personName, process_id: processId, process_name: processName }),
        });
        if (!res.ok) throw new Error('Failed to start work');
        return res.json();
    },

    stopWork: async (logId: string, personName: string): Promise<WorkLog> => {
        const res = await fetch(`${API_BASE}/work-log/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: logId, person_name: personName }),
        });
        if (!res.ok) throw new Error('Failed to stop work');
        return res.json();
    },

    deleteProcess: async (id: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/processes/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete process');
    }
};
