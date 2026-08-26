import { getAdminKPIs } from "../actions";
import Link from "next/link";
import BookingStatusBadge from "../../components/BookingStatusBadge";
import {
  Bed,
  Utensils,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2
} from "lucide-react";

export const metadata = {
  title: "Executive Dashboard — St. Lachland Hotel",
  description: "Operational management overview, room occupancy, dining covers, and revenue metrics.",
};

export default async function AdminDashboardPage() {
  let kpis;
  try {
    kpis = await getAdminKPIs();
  } catch (err) {
    return (
      <div className="ad-content">
        <h1 className="ad-title">Executive Dashboard</h1>
        <div className="err mt-4">{err.message}</div>
      </div>
    );
  }

  const { occupancy, dining, events, revenue, recent_stays } = kpis;

  return (
    <div className="ad-content">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="eyebrow">Estate Operational Center</span>
          <h1 className="ad-title text-2xl md:text-3xl">Executive Hotel Dashboard</h1>
          <p className="text-stone-500 text-xs mt-1">Real-time status of rooms, dining service, and AI event coordination.</p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/bookings" className="btn btn-solid btn-sm">
            <span>Manage All Bookings</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Room Occupancy */}
        <div className="bg-white border border-line rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-mist font-semibold uppercase">Room Occupancy</span>
            <div className="p-2 bg-emerald/10 text-emerald rounded-lg">
              <Bed size={18} />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-emerald">
            {occupancy.rate}%
          </div>
          <div className="flex justify-between text-2xs text-stone-500 mt-2 border-t border-stone-100 pt-2">
            <span>{occupancy.occupied_rooms} / {occupancy.total_rooms} Rooms Occupied</span>
            <span className="text-emerald font-semibold">{occupancy.today_checkins} Check-ins Today</span>
          </div>
        </div>

        {/* Dining Covers */}
        <div className="bg-white border border-line rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-mist font-semibold uppercase">Today&rsquo;s Dining</span>
            <div className="p-2 bg-gold/15 text-stone-900 rounded-lg">
              <Utensils size={18} />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-emerald">
            {dining.today_covers}
          </div>
          <div className="flex justify-between text-2xs text-stone-500 mt-2 border-t border-stone-100 pt-2">
            <span>{dining.today_reservations} Table Reservations</span>
            <span className="text-amber-700 font-semibold">{dining.active_kitchen_orders} Kitchen Orders</span>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white border border-line rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-mist font-semibold uppercase">Upcoming Events</span>
            <div className="p-2 bg-emerald/10 text-emerald rounded-lg">
              <Calendar size={18} />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-emerald">
            {events.upcoming_count}
          </div>
          <div className="flex justify-between text-2xs text-stone-500 mt-2 border-t border-stone-100 pt-2">
            <span>Confirmed celebrations</span>
            <span className="text-emerald font-semibold">AI Optimized</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white border border-line rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-mist font-semibold uppercase">Monthly Gross</span>
            <div className="p-2 bg-emerald/10 text-emerald rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-emerald truncate">
            LKR {Number(revenue.month_total).toLocaleString()}
          </div>
          <div className="text-2xs text-stone-500 mt-2 border-t border-stone-100 pt-2 truncate">
            Stays: {Math.round((revenue.stays / (revenue.month_total || 1)) * 100)}% · Events: {Math.round((revenue.events / (revenue.month_total || 1)) * 100)}%
          </div>
        </div>
      </div>

      {/* Grid: Quick Actions & Live Kitchen Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left: Recent Sanctuary Bookings (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-line rounded-xl p-6 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-serif font-bold text-lg text-emerald">Recent Sanctuary Bookings</h2>
            <Link href="/admin/stay_bookings" className="text-xs text-emerald font-semibold hover:underline">
              View all stay records →
            </Link>
          </div>

          {recent_stays.length === 0 ? (
            <p className="text-stone-400 text-xs italic py-4">No recent bookings recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase">
                    <th className="py-2.5">Ref Code</th>
                    <th className="py-2.5">Guest</th>
                    <th className="py-2.5">Sanctuary</th>
                    <th className="py-2.5">Check-In</th>
                    <th className="py-2.5">Total (LKR)</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recent_stays.map((b) => (
                    <tr key={b.id} className="hover:bg-stone-50">
                      <td className="py-2.5 font-mono font-bold text-emerald">{b.confirmation_code}</td>
                      <td className="py-2.5 font-medium">{b.guest_name || "Guest"}</td>
                      <td className="py-2.5 text-stone-600">{b.room_type}</td>
                      <td className="py-2.5">{b.check_in_date}</td>
                      <td className="py-2.5 font-mono">{Number(b.total_amount).toLocaleString()}</td>
                      <td className="py-2.5">
                        <BookingStatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Operational Shortcuts & Modules (1 col) */}
        <div className="bg-white border border-line rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-lg text-emerald border-b border-line pb-3">
            Operational Hubs
          </h2>

          <Link
            href="/admin/restaurant"
            className="flex items-center justify-between p-3.5 bg-stone-50 rounded-lg border border-line hover:border-emerald transition-all text-xs"
          >
            <div className="flex items-center gap-3">
              <Utensils size={18} className="text-emerald" />
              <div>
                <strong className="block text-stone-800">Kitchen Ticket Board</strong>
                <span className="text-stone-500">{dining.active_kitchen_orders} active orders in queue</span>
              </div>
            </div>
            <ArrowRight size={14} className="text-mist" />
          </Link>

          <Link
            href="/admin/revenue"
            className="flex items-center justify-between p-3.5 bg-stone-50 rounded-lg border border-line hover:border-emerald transition-all text-xs"
          >
            <div className="flex items-center gap-3">
              <TrendingUp size={18} className="text-emerald" />
              <div>
                <strong className="block text-stone-800">Revenue Analytics</strong>
                <span className="text-stone-500">Stays, Events &amp; Dining breakdowns</span>
              </div>
            </div>
            <ArrowRight size={14} className="text-mist" />
          </Link>

          <Link
            href="/admin/analytics"
            className="flex items-center justify-between p-3.5 bg-stone-50 rounded-lg border border-line hover:border-emerald transition-all text-xs"
          >
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-gold" />
              <div>
                <strong className="block text-stone-800">AI Research Telemetry</strong>
                <span className="text-stone-500">Pareto frontiers &amp; XAI audits</span>
              </div>
            </div>
            <ArrowRight size={14} className="text-mist" />
          </Link>
        </div>
      </div>
    </div>
  );
}
