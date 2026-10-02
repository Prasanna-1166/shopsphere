import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import Modal from '../components/common/Modal';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  // Selected Log JSON View Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (actionFilter) query.set('action', actionFilter);
      if (entityFilter) query.set('entity', entityFilter);
      query.set('page', page);
      query.set('limit', '20');

      const res = await api.get(`/admin/audit-logs?${query.toString()}`);
      if (res.data) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, entityFilter, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Security & Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable tracking of administrative actions, catalog modifications, and order state transitions
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs rounded-xl transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search action, user, or entity..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500 cursor-pointer"
        >
          <option value="">All Entities</option>
          <option value="PRODUCT">PRODUCT</option>
          <option value="CATEGORY">CATEGORY</option>
          <option value="ORDER">ORDER</option>
          <option value="USER">USER</option>
          <option value="AUTH">AUTH</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500 cursor-pointer"
        >
          <option value="">All Actions</option>
          <option value="PRODUCT_CREATE">PRODUCT_CREATE</option>
          <option value="PRODUCT_UPDATE">PRODUCT_UPDATE</option>
          <option value="PRODUCT_STATUS_TOGGLE">PRODUCT_STATUS_TOGGLE</option>
          <option value="ORDER_STATUS_UPDATE">ORDER_STATUS_UPDATE</option>
          <option value="INVENTORY_ADJUST">INVENTORY_ADJUST</option>
          <option value="ADMIN_LOGIN">ADMIN_LOGIN</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 uppercase font-bold border-b border-slate-800">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor / User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Entity ID</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    Loading audit stream...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 font-sans font-bold text-white">
                      {log.user ? `${log.user.name} (${log.user.role})` : 'System Action'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-admin-500/20 text-admin-300 font-bold border border-admin-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{log.entity}</td>
                    <td className="p-4 text-slate-400">
                      {log.entityId ? `${log.entityId.slice(0, 12)}...` : '—'}
                    </td>
                    <td className="p-4 text-right font-sans">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setIsModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-lg transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-30 flex items-center gap-1 font-sans"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="text-xs text-slate-400 font-sans">
              Page <strong className="text-white">{pagination.page}</strong> of{' '}
              <strong className="text-white">{pagination.totalPages}</strong>
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-30 flex items-center gap-1 font-sans"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Inspect Log Metadata Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Audit Event: ${selectedLog?.action}`}
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-500">Actor</span>
                <div className="font-bold text-white">
                  {selectedLog.user?.name || 'Automated System'}
                </div>
                <div className="text-[10px] text-slate-400">{selectedLog.user?.email}</div>
              </div>
              <div>
                <span className="text-slate-500">Entity & ID</span>
                <div className="font-bold text-white">{selectedLog.entity}</div>
                <div className="font-mono text-[10px] text-slate-400">
                  {selectedLog.entityId || 'N/A'}
                </div>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-bold block mb-1">Payload Metadata:</span>
              <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto">
                {JSON.stringify(selectedLog.metadata, null, 2) || 'No payload metadata recorded'}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
