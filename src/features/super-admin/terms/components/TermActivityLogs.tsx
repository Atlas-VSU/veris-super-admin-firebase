"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";
import { format } from "date-fns";

export interface AuditLogEntry {
  id: string;
  orgName: string;
  termName: string;
  action: string;
  details: string;
  timestamp: string;
}

interface TermActivityLogsProps {
  auditLogs: AuditLogEntry[];
}

export function TermActivityLogs({ auditLogs }: TermActivityLogsProps) {
  return (
    <Card className="border border-blue-50 shadow-sm mt-6">
      <CardHeader className="pb-3 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-700">Recent Subscription Activity Log</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Audit log of super admin billing events across the platform</p>
          </div>
          <History className="h-4 w-4 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-6">
        <div className="relative border-l border-slate-200 pl-4 space-y-4">
          {auditLogs.map((log) => (
            <div key={log.id} className="relative">
              {/* Timeline node */}
              <div className="absolute -left-[21px] mt-1.5 h-2.5 w-2.5 rounded-full border border-white bg-blue-500 shadow-sm" />
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-700">{log.action}</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 font-semibold px-1.5 py-0.25 rounded">
                    {log.orgName}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto">
                    {format(new Date(log.timestamp), "MMM dd, yyyy p")}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">{log.details}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.termName}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
