import { getAuditLogsAdmin } from "../../actions";
import { ScrollText, ShieldAlert, CheckCircle, Clock } from "lucide-react";

export const metadata = {
  title: "System Audit Trail — St. Lachland Hotel",
  description: "Immutable ledger of all administrative data mutations, status overrides, and system events.",
};

export default async function AuditLogPage() {
  let logs = [];
  try {
    logs = await getAuditLogsAdmin();
  } catch (err) {
    return (
      <div className="ad-content">
        <h1 className="ad-title">System Audit Trail</h1>
        <div className="err mt-4">{err.message}</div>
      </div>
    );
  }

  return (
    <div className="ad-content space-y-6">
      <div>
        <span className="eyebrow">Governance &amp; Security</span>
        <h1 className="ad-title text-2xl md:text-3xl">System Audit Trail</h1>
        <p className="text-stone-500 text-xs mt-1">
          Cryptographically timestamped and immutable administrative activity records.
        </p>
      </div>

      <div className="bg-white border border-line rounded-xl shadow-xs overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-xs italic">
            No audit records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-stone-50 border-b border-line text-stone-500 uppercase font-semibold">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Admin Staff</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Domain Table</th>
                  <th className="p-3">Record ID</th>
                  <th className="p-3">Change Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3 font-mono text-stone-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="p-3 font-medium text-stone-900">
                      {log.admin_name || "System"}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-2xs font-bold font-mono bg-stone-100 border border-stone-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-emerald font-semibold">
                      {log.table_name || "—"}
                    </td>

                    <td className="p-3 font-mono text-stone-600">
                      #{log.record_id || "—"}
                    </td>

                    <td className="p-3 font-mono text-3xs text-stone-500 max-w-xs truncate">
                      {log.new_values ? (typeof log.new_values === "string" ? log.new_values : JSON.stringify(log.new_values)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
