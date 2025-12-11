import React from 'react';
import { LogEntry } from '../types';
import { FileClock, User, Settings, Activity, DollarSign } from 'lucide-react';

interface ClinicLogsProps {
    logs: LogEntry[];
}

const ClinicLogs: React.FC<ClinicLogsProps> = ({ logs }) => {
  const getIcon = (type: LogEntry['type']) => {
      switch(type) {
          case 'clinical': return <Activity className="w-5 h-5 text-blue-600" />;
          case 'financial': return <DollarSign className="w-5 h-5 text-green-600" />;
          case 'admin': return <User className="w-5 h-5 text-purple-600" />;
          case 'system': return <Settings className="w-5 h-5 text-slate-600" />;
          default: return <FileClock className="w-5 h-5 text-slate-600" />;
      }
  };

  const getBg = (type: LogEntry['type']) => {
      switch(type) {
          case 'clinical': return 'bg-blue-100';
          case 'financial': return 'bg-green-100';
          case 'admin': return 'bg-purple-100';
          default: return 'bg-slate-100';
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 max-w-4xl mx-auto overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
                <h2 className="text-lg font-bold text-slate-800">System Activity Logs</h2>
                <p className="text-sm text-slate-500">Audit trail of clinic activities</p>
            </div>
            <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-500">
                {logs.length} Total Events
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-slate-100">
                {logs.map(log => (
                    <div key={log.id} className="p-4 flex items-start space-x-4 hover:bg-slate-50 transition-colors">
                        <div className={`p-2 rounded-lg mt-1 ${getBg(log.type)}`}>
                            {getIcon(log.type)}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-slate-800">{log.action}</p>
                                <span className="text-xs text-slate-400 font-mono whitespace-nowrap ml-4">
                                    {new Date(log.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">User: <span className="font-medium text-slate-700">{log.user}</span></p>
                            {log.details && (
                                <p className="text-xs text-slate-400 mt-1 italic border-l-2 border-slate-200 pl-2">
                                    {log.details}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="text-center py-10 text-slate-400">No logs available.</div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ClinicLogs;