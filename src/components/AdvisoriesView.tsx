import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle2, ShieldAlert, Clock, Bell, Sparkles, Send } from 'lucide-react';
import { ServiceAdvisory, TransitLine } from '../types/transit';

interface AdvisoriesViewProps {
  advisories: ServiceAdvisory[];
  lines: TransitLine[];
  onAddAdvisory: (adv: ServiceAdvisory) => void;
}

export const AdvisoriesView: React.FC<AdvisoriesViewProps> = ({
  advisories,
  lines,
  onAddAdvisory,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLineId, setReportLineId] = useState('M1');

  const filtered = advisories.filter((a) => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;

    const newAdv: ServiceAdvisory = {
      id: `ADV-${Date.now().toString().slice(-4)}`,
      lineId: reportLineId,
      severity: 'minor',
      title: reportTitle.trim(),
      description: reportDesc.trim() || 'Passenger crowd notice logged via operator portal.',
      delayMinutes: 2,
      updatedAt: 'Just now',
      active: true,
    };

    onAddAdvisory(newAdv);
    setReportTitle('');
    setReportDesc('');
    setShowReportForm(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">
                Service Advisories & Network Operations
              </h2>
              <p className="text-xs text-[#64748b] mt-0.5">
                Live dispatch updates, track maintenance windows, and signal status alerts.
              </p>
            </div>

            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="px-3.5 py-1.5 bg-[#1e40af] hover:bg-[#00288e] text-white text-xs font-semibold rounded transition-colors self-start sm:self-auto"
            >
              {showReportForm ? 'Cancel Report' : '+ Dispatch Notice'}
            </button>
          </div>

          {/* Quick Line Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-5 pt-4 border-t border-[#f1f5f9]">
            {lines.map((line) => {
              const isDelayed = line.status === 'delayed';
              return (
                <div
                  key={line.id}
                  className="p-2.5 rounded border border-[#e2e8f0] bg-[#faf8ff] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={{ backgroundColor: line.color }}
                      className="px-1.5 py-0.2 text-[10px] font-mono font-bold text-white rounded"
                    >
                      {line.code}
                    </span>
                    {isDelayed ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#d97706]" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-bold text-[#0f172a] truncate">
                      {line.name}
                    </div>
                    <div
                      className={`text-[11px] font-medium mt-0.5 ${
                        isDelayed ? 'text-[#d97706]' : 'text-[#059669]'
                      }`}
                    >
                      {isDelayed ? 'Delayed (+4m)' : 'On Time'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dispatch Form Modal/Inline */}
        {showReportForm && (
          <form
            onSubmit={handleSubmitReport}
            className="bg-white border border-[#cbd5e1] rounded-lg p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
              <Bell className="w-4 h-4 text-[#1e40af]" />
              <span>Log Dispatch Incident / Advisory</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-[#475569]">Affected Line</label>
                <select
                  value={reportLineId}
                  onChange={(e) => setReportLineId(e.target.value)}
                  className="w-full mt-1 bg-white border border-[#cbd5e1] rounded px-2.5 py-1.5 text-xs text-[#0f172a]"
                >
                  {lines.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-[#475569]">Title / Subject</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Platform Congestion at Grand Market"
                  className="w-full mt-1 bg-white border border-[#cbd5e1] rounded px-2.5 py-1.5 text-xs text-[#0f172a]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#475569]">Operational Notes</label>
              <textarea
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                rows={2}
                placeholder="Provide details for customer communication..."
                className="w-full mt-1 bg-white border border-[#cbd5e1] rounded px-2.5 py-1.5 text-xs text-[#0f172a]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="px-3 py-1.5 text-xs font-medium border border-[#cbd5e1] rounded hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#1e40af] hover:bg-[#00288e] text-white text-xs font-semibold rounded flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Dispatch</span>
              </button>
            </div>
          </form>
        )}

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#64748b] font-medium mr-1">Filter:</span>
          {['all', 'moderate', 'minor', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded capitalize font-medium transition-colors ${
                filterSeverity === sev
                  ? 'bg-[#1e40af] text-white'
                  : 'bg-white border border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9]'
              }`}
            >
              {sev === 'all' ? 'All Advisories' : sev}
            </button>
          ))}
        </div>

        {/* Advisories Feed */}
        <div className="space-y-3">
          {filtered.map((adv) => {
            const line = adv.lineId ? lines.find((l) => l.id === adv.lineId) : null;
            const isWarn = adv.severity === 'critical' || adv.severity === 'moderate';

            return (
              <div
                key={adv.id}
                className="bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-xs flex items-start gap-3.5"
              >
                <div
                  className={`p-2 rounded mt-0.5 shrink-0 ${
                    isWarn
                      ? 'bg-[#fef3c7] text-[#b45309]'
                      : 'bg-[#eff6ff] text-[#1e40af]'
                  }`}
                >
                  {isWarn ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {line && (
                        <span
                          style={{ backgroundColor: line.color }}
                          className="px-1.5 py-0.2 text-[10px] font-mono font-bold text-white rounded"
                        >
                          {line.code}
                        </span>
                      )}
                      <h3 className="font-bold text-sm text-[#0f172a]">
                        {adv.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#64748b]">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono text-[11px]">{adv.updatedAt}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
                    {adv.description}
                  </p>

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#f1f5f9] text-[11px]">
                    <span className="text-[#64748b]">Delay Impact:</span>
                    <span className="font-mono font-semibold text-[#0f172a]">
                      {adv.delayMinutes > 0 ? `+${adv.delayMinutes} mins` : 'Nominal'}
                    </span>
                    <span className="text-[#cbd5e1]">·</span>
                    <span className="text-[#059669] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                      Actively Monitored
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
