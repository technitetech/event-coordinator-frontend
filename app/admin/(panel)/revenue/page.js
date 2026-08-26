import { getRevenueAnalyticsAdmin } from "../../actions";
import { DollarSign, TrendingUp, Bed, Calendar, Utensils } from "lucide-react";

export const metadata = {
  title: "Revenue Analytics — St. Lachland Hotel",
  description: "Financial performance across Stays, AI Event Celebrations, and Restaurant Dining.",
};

export default async function RevenueAnalyticsPage() {
  let data;
  try {
    data = await getRevenueAnalyticsAdmin();
  } catch (err) {
    return (
      <div className="ad-content">
        <h1 className="ad-title">Revenue Analytics</h1>
        <div className="err mt-4">{err.message}</div>
      </div>
    );
  }

  const { monthly_stays, monthly_events, monthly_dining } = data;

  // Aggregate totals
  const totalStays = monthly_stays.reduce((s, r) => s + Number(r.total), 0);
  const totalEvents = monthly_events.reduce((s, r) => s + Number(r.total), 0);
  const totalDining = monthly_dining.reduce((s, r) => s + Number(r.total), 0);
  const grandTotal = totalStays + totalEvents + totalDining || 1;

  const pctStays = Math.round((totalStays / grandTotal) * 100);
  const pctEvents = Math.round((totalEvents / grandTotal) * 100);
  const pctDining = Math.round((totalDining / grandTotal) * 100);

  return (
    <div className="ad-content space-y-8">
      <div>
        <span className="eyebrow">Financial Performance</span>
        <h1 className="ad-title text-2xl md:text-3xl">Estate Revenue Analytics</h1>
        <p className="text-stone-500 text-xs mt-1">
          Historical and real-time revenue streams across Accommodation, AI Event Planning, and Restaurant Dining.
        </p>
      </div>

      {/* Revenue KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white border border-line rounded-xl p-5 shadow-xs">
          <span className="text-xs text-mist font-semibold uppercase block mb-1">Gross Estate Revenue</span>
          <div className="font-serif text-2xl font-bold text-emerald">
            LKR {grandTotal.toLocaleString()}
          </div>
          <span className="text-2xs text-stone-500 mt-1 block">All operational domains</span>
        </div>

        <div className="bg-white border border-line rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-mist font-semibold uppercase">Room Stays</span>
            <Bed size={16} className="text-emerald" />
          </div>
          <div className="font-serif text-xl font-bold text-emerald">
            LKR {totalStays.toLocaleString()}
          </div>
          <span className="text-2xs text-stone-500 mt-1 block">{pctStays}% of gross volume</span>
        </div>

        <div className="bg-white border border-line rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-mist font-semibold uppercase">Event Planning</span>
            <Calendar size={16} className="text-emerald" />
          </div>
          <div className="font-serif text-xl font-bold text-emerald">
            LKR {totalEvents.toLocaleString()}
          </div>
          <span className="text-2xs text-stone-500 mt-1 block">{pctEvents}% of gross volume</span>
        </div>

        <div className="bg-white border border-line rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-mist font-semibold uppercase">Restaurant Dining</span>
            <Utensils size={16} className="text-emerald" />
          </div>
          <div className="font-serif text-xl font-bold text-emerald">
            LKR {totalDining.toLocaleString()}
          </div>
          <span className="text-2xs text-stone-500 mt-1 block">{pctDining}% of gross volume</span>
        </div>
      </div>

      {/* Breakdown Bar Visualizer */}
      <div className="bg-white border border-line rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="font-serif font-bold text-lg text-emerald">Portfolio Revenue Stream Mix</h2>
        <div className="w-full h-4 bg-stone-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald transition-all" style={{ width: `${pctStays}%` }} title={`Stays: ${pctStays}%`} />
          <div className="h-full bg-gold transition-all" style={{ width: `${pctEvents}%` }} title={`Events: ${pctEvents}%`} />
          <div className="h-full bg-teal-600 transition-all" style={{ width: `${pctDining}%` }} title={`Dining: ${pctDining}%`} />
        </div>

        <div className="flex flex-wrap gap-6 text-xs font-semibold pt-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald" />
            <span>Room Stays ({pctStays}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gold" />
            <span>AI Event Celebrations ({pctEvents}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-600" />
            <span>Restaurant Dining ({pctDining}%)</span>
          </div>
        </div>
      </div>

      {/* Monthly History Table */}
      <div className="bg-white border border-line rounded-xl p-6 shadow-xs">
        <h2 className="font-serif font-bold text-lg text-emerald mb-4">Monthly Inflow Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-line text-stone-500 uppercase font-semibold">
                <th className="py-2.5">Month</th>
                <th className="py-2.5">Stays Revenue (LKR)</th>
                <th className="py-2.5">Events Revenue (LKR)</th>
                <th className="py-2.5">Dining Revenue (LKR)</th>
                <th className="py-2.5 font-bold">Total Inflow (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {monthly_stays.map((ms) => {
                const ev = monthly_events.find((e) => e.month === ms.month)?.total || 0;
                const din = monthly_dining.find((d) => d.month === ms.month)?.total || 0;
                const monthSum = Number(ms.total) + Number(ev) + Number(din);
                return (
                  <tr key={ms.month} className="hover:bg-stone-50">
                    <td className="py-3 font-mono font-bold text-emerald">{ms.month}</td>
                    <td className="py-3 font-mono">{Number(ms.total).toLocaleString()}</td>
                    <td className="py-3 font-mono">{Number(ev).toLocaleString()}</td>
                    <td className="py-3 font-mono">{Number(din).toLocaleString()}</td>
                    <td className="py-3 font-mono font-bold text-emerald">{monthSum.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
