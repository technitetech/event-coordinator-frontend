"use client";

import { useState } from "react";
import { updateKitchenOrderStatusAdmin } from "../../actions";
import { Clock, CheckCircle2, ArrowRight, Utensils } from "lucide-react";

export default function KitchenBoard({ initialOrders }) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  const handleAdvanceStatus = async (orderId, currentStatus) => {
    const nextStatusMap = {
      received: "preparing",
      preparing: "ready",
      ready: "served",
    };
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    setUpdatingId(orderId);
    try {
      // The action returns {ok:false, error} for a rejected transition rather
      // than throwing, so the result must be inspected — otherwise the board
      // would optimistically show a move the server refused.
      const res = await updateKitchenOrderStatusAdmin(orderId, nextStatus);
      if (!res?.ok) {
        setError(res?.error || "Could not advance this order.");
        return;
      }
      setError(null);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    } catch (err) {
      setError(err.message || "Failed to advance order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    { id: "received", title: "New Orders (Received)", bg: "bg-amber-50/50", border: "border-amber-200", badge: "bg-amber-100 text-amber-800" },
    { id: "preparing", title: "In Kitchen (Cooking)", bg: "bg-orange-50/50", border: "border-orange-200", badge: "bg-orange-100 text-orange-800" },
    { id: "ready", title: "Ready at Pass", bg: "bg-cyan-50/50", border: "border-cyan-200", badge: "bg-cyan-100 text-cyan-800" },
    { id: "served", title: "Served & Completed", bg: "bg-emerald-50/50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-800" },
  ];

  return (
    <>
    {error && (
      <div
        role="alert"
        className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        {error}
      </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
      {columns.map((col) => {
        const colOrders = orders.filter((o) => o.status === col.id);
        return (
          <div
            key={col.id}
            className={`p-4 rounded-xl border ${col.border} ${col.bg} min-h-[480px] flex flex-col justify-between`}
          >
            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-200">
                <span className={`text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${col.badge}`}>
                  {col.title}
                </span>
                <span className="font-mono text-xs font-bold text-stone-500">
                  {colOrders.length}
                </span>
              </div>

              {colOrders.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs italic">
                  No orders in this queue.
                </div>
              ) : (
                <div className="space-y-4">
                  {colOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 bg-white border border-line rounded-lg shadow-xs space-y-3 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-stone-900 block text-sm">
                            Table {order.table_number || "Walk-In"}
                          </strong>
                          <span className="text-stone-400 text-2xs">Order #{order.id} · {order.guest_name || "Guest"}</span>
                        </div>
                        <span className="font-mono text-2xs text-stone-400 flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Itemized list */}
                      <div className="border-t border-dashed border-stone-100 pt-2 space-y-1">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between font-medium text-stone-800">
                            <span>{item.quantity}× {item.item_name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Advance Button */}
                      {col.id !== "served" && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => handleAdvanceStatus(order.id, order.status)}
                          className="btn btn-solid btn-sm w-full justify-center text-xs mt-2 py-1.5"
                          style={{ fontSize: "0.75rem" }}
                        >
                          <span>{col.id === "received" ? "Send to Kitchen" : col.id === "preparing" ? "Mark as Ready" : "Mark as Served"}</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
