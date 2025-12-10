import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';

interface ActiveTaskState {
    activeLogId: string | null;
    startTime: string | null; // ISO string
    personName: string;
    activeProcessId: string | null;
    activeProcessName: string | null;

    startSession: (logId: string, startTime: string, processId: string, processName: string) => void;
    endSession: () => void;
    setPersonName: (name: string) => void;
}

export const useStore = create<ActiveTaskState>()(
    persist(
        (set) => ({
            activeLogId: null,
            startTime: null,
            personName: '',
            activeProcessId: null,
            activeProcessName: null,

            startSession: (logId, startTime, processId, processName) => set({
                activeLogId: logId,
                startTime,
                activeProcessId: processId,
                activeProcessName: processName
            }),

            endSession: () => set({
                activeLogId: null,
                startTime: null,
                activeProcessId: null,
                activeProcessName: null
            }),

            setPersonName: (name) => set({ personName: name }),
        }),
        {
            name: 'wabash-process-store',
        }
    )
);
