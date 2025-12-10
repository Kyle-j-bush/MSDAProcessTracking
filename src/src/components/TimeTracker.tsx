import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { api, Process } from '../api';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Play, Square, User, Clock } from 'lucide-react';

dayjs.extend(duration);

export const TimeTracker: React.FC = () => {
    const {
        personName, setPersonName,
        activeLogId, startTime, activeProcessId, activeProcessName,
        startSession, endSession
    } = useStore();

    const [processes, setProcesses] = useState<Process[]>([]);
    const [selectedProcess, setSelectedProcess] = useState<string>('');
    const [elapsed, setElapsed] = useState<string>('00:00:00');
    const [loading, setLoading] = useState(false);

    // Fetch processes on mount
    useEffect(() => {
        api.getProcesses().then(setProcesses).catch(console.error);
    }, []);

    // Timer tick
    useEffect(() => {
        let interval: any;
        if (activeLogId && startTime) {
            const updateTimer = () => {
                const start = dayjs(startTime);
                const now = dayjs();
                const diff = dayjs.duration(now.diff(start));
                setElapsed(diff.format('HH:mm:ss'));
            };

            updateTimer(); // Initial
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsed('00:00:00');
        }
        return () => clearInterval(interval);
    }, [activeLogId, startTime]);

    const handleStart = async () => {
        if (!selectedProcess || !personName) return;
        setLoading(true);
        try {
            const proc = processes.find(p => p.id === selectedProcess);
            const log = await api.startWork(personName, selectedProcess, proc?.name || 'Unknown');
            startSession(log.id, log.start_timestamp, selectedProcess, proc?.name || 'Unknown');
        } catch (e) {
            alert('Error starting work. Check connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        if (!activeLogId) return;
        setLoading(true);
        try {
            await api.stopWork(activeLogId, personName);
            endSession();
            setElapsed('00:00:00');
        } catch (e) {
            alert('Error stopping work. Try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!personName) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-[80vh]">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
                    <div className="bg-purple-100 p-4 rounded-full inline-block mb-4">
                        <User className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Who is working?</h2>
                    <form onSubmit={(e) => { e.preventDefault(); /* just submit */ }}>
                        <label className="block text-left text-sm font-medium text-gray-600 mb-1">Enter your name</label>
                        <input
                            type="text"
                            className="w-full p-4 border border-gray-300 rounded-xl mb-6 text-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="e.g., John Doe"
                            onBlur={(e) => { if (e.target.value) setPersonName(e.target.value); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') setPersonName(e.currentTarget.value); }}
                        />
                        <button className="hidden">Submit</button>
                    </form>
                    <p className="text-sm text-gray-400">Press Enter or click outside to save</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-4 max-w-md mx-auto h-[85vh] safe-area-bottom">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Employee</p>
                        <p className="font-semibold text-gray-900">{personName}</p>
                    </div>
                </div>
                <button
                    onClick={() => setPersonName('')}
                    className="text-sm text-primary font-medium hover:text-primary-dark"
                >
                    Change
                </button>
            </div>

            {activeLogId ? (
                /* ACTIVE STATE */
                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                    <div className="text-center space-y-2 animate-pulse">
                        <p className="text-gray-500 font-medium">currently tracking</p>
                        <h2 className="text-3xl font-bold text-gray-800">{activeProcessName}</h2>
                    </div>

                    <div className="w-64 h-64 rounded-full border-8 border-purple-100 flex items-center justify-center bg-white shadow-inner">
                        <div className="text-center">
                            <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                            <span className="text-5xl font-mono font-bold text-gray-700 tracking-wider">
                                {elapsed}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleStop}
                        disabled={loading}
                        className="btn-danger flex items-center justify-center gap-4 mt-8"
                    >
                        <Square className="w-8 h-8 fill-current" />
                        STOP WORK
                    </button>
                </div>
            ) : (
                /* IDLE STATE */
                <div className="flex-1 flex flex-col justify-center space-y-6">
                    <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">Select Process</label>
                        <select
                            className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl bg-white focus:border-primary focus:ring-primary transition-colors"
                            value={selectedProcess}
                            onChange={e => setSelectedProcess(e.target.value)}
                        >
                            <option value="">-- Choose Task --</option>
                            {processes.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 flex items-end pb-8">
                        <button
                            onClick={handleStart}
                            disabled={!selectedProcess || loading}
                            className={`btn-success flex items-center justify-center gap-4 ${(!selectedProcess || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Play className="w-8 h-8 fill-current" />
                            START WORK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
