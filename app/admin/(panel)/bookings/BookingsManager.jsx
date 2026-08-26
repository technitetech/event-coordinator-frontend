"use client";

import { useState } from "react";
import BookingStatusBadge from "../../../components/BookingStatusBadge";
import { updateUnifiedBookingStatus } from "../../actions";
import { Search, Filter, CheckCircle2, Bed, Calendar, Utensils, RefreshCw } from "lucide-react";

export default function BookingsManager({ initialStays, initialEvents, initialDining }) {
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Combine bookings
  const allList = [
    ...initialStays.map((s) => ({ ...s, type: "stay" })),
    ...initialEvents.map((e) => ({ ...e, type: "event" })),
    ...initialDining.map((d) => ({ ...d, type: "dining" })),
  ].sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()));

  const filteredList = allList.filter((b) => {
    if (selectedType !== "all" && b.type !== selectedType) return false;
    if (selectedStatus !== "all" && b.status !== selectedStatus) return false;
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const matchName = b.guest_name?.toLowerCase().includes(term);
      const matchCode = b.confirmation_code?.toLowerCase().includes(term);
      const matchEmail = b.guest_email?.toLowerCase().includes(term);
      if (!matchName && !matchCode && !matchEmail) return false;
    }
    return true;
  });

  const handleStatusChange = async (category, id, newStatus) => {
    setUpdatingId(id);
    setStatusMessage(null);
    try {
      const res = await updateUnifiedBookingStatus(category, id, newStatus);
      if (res?.ok) {
        setStatusMessage({ tone: "ok", text: `Booking #${id} updated to ${newStatus}.` });
        window.location.reload();
      } else {
        // A rejected transition previously fell through this branch silently,
        // so the admin saw no change and no explanation.
        setStatusMessage({ tone: "error", text: res?.error || "Could not update this booking." });
      }
    } catch (err) {
      setStatusMessage({ tone: "error", text: err.message || "Failed to update status." });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bookings-manager-space space-y-6">
      {statusMessage && (
        <div
          role={statusMessage.tone === "error" ? "alert" : "status"}
          className={
            statusMessage.tone === "error"
              ? "p-3 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs font-semibold flex items-center gap-2"
              : "p-3 bg-emerald/10 border border-emerald rounded-lg text-emerald text-xs font-semibold flex items-center gap-2"
          }
        >
          <CheckCircle2 size={14} />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-line rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <input
            type="text"
            placeholder="Search by name, ref code, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-line rounded-lg text-xs focus:outline-none focus:border-emerald"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 w-full md:w-auto">
          {[
            { id: "all", label: "All Categories", count: allList.length },
            { id: "stay", label: "Stays", count: initialStays.length, icon: Bed },
            { id: "event", label: "Events", count: initialEvents.length, icon: Calendar },
            { id: "dining", label: "Dining", count: initialDining.length, icon: Utensils },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              className={`btn btn-sm text-xs ${selectedType === t.id ? "btn-solid" : "btn-ghost"}`}
              style={{ padding: "4px 10px" }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 text-xs w-full md:w-auto">
          <Filter size={14} className="text-mist" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-1.5 border border-line rounded-lg text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-line rounded-xl shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-xs">
            No bookings match your current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-stone-50 border-b border-line text-stone-500 uppercase font-semibold">
                  <th className="p-3">Ref Code / ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Guest Details</th>
                  <th className="p-3">Service / Dates</th>
                  <th className="p-3">Total Investment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredList.map((b) => (
                  <tr key={`${b.type}-${b.id}`} className="hover:bg-stone-50 transition-colors">
                    {/* Ref Code */}
                    <td className="p-3 font-mono font-bold text-emerald">
                      {b.confirmation_code || `#${b.id}`}
                    </td>

                    {/* Category Pill */}
                    <td className="p-3">
                      <span className="capitalize px-2 py-0.5 rounded text-2xs font-bold border border-line">
                        {b.type}
                      </span>
                    </td>

                    {/* Guest */}
                    <td className="p-3">
                      <strong className="block text-stone-900">{b.guest_name || "Guest"}</strong>
                      <span className="text-2xs text-stone-400">{b.guest_email}</span>
                    </td>

                    {/* Service & Dates */}
                    <td className="p-3 text-stone-700">
                      {b.type === "stay" && (
                        <div>
                          <strong>{b.room_type_name}</strong> (Room {b.room_number || "TBC"})
                          <div className="text-2xs text-mist">{b.check_in_date} → {b.check_out_date} ({b.nights}n)</div>
                        </div>
                      )}
                      {b.type === "event" && (
                        <div>
                          <strong>{b.event_type?.toUpperCase()}</strong> ({b.venue_name || "Venue TBC"})
                          <div className="text-2xs text-mist">{b.event_date} · {b.guests} guests</div>
                        </div>
                      )}
                      {b.type === "dining" && (
                        <div>
                          <strong>Table {b.table_number}</strong> ({b.occasion || "Dining"})
                          <div className="text-2xs text-mist">{b.reservation_date} at {b.time_slot} ({b.covers} covers)</div>
                        </div>
                      )}
                    </td>

                    {/* Total */}
                    <td className="p-3 font-mono font-semibold">
                      {b.total_amount ? `LKR ${Number(b.total_amount).toLocaleString()}` : "—"}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3">
                      <BookingStatusBadge status={b.status} />
                    </td>

                    {/* Quick Status Change Dropdown */}
                    <td className="p-3 text-right">
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusChange(b.type, b.id, e.target.value)}
                        disabled={updatingId === b.id}
                        className="text-2xs p-1 border border-line rounded bg-white font-medium"
                      >
                        <option value="pending">Set Pending</option>
                        <option value="confirmed">Set Confirmed</option>
                        {b.type === "stay" && <option value="checked_in">Set Checked In</option>}
                        {b.type === "stay" && <option value="checked_out">Set Checked Out</option>}
                        {b.type === "dining" && <option value="seated">Set Seated</option>}
                        {b.type === "dining" && <option value="completed">Set Completed</option>}
                        <option value="cancelled">Set Cancelled</option>
                      </select>
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
