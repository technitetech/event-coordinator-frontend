import { getKitchenOrdersAdmin } from "../../actions";
import KitchenBoard from "./KitchenBoard";

export const metadata = {
  title: "Kitchen Order Board — St. Lachland Hotel",
  description: "Live restaurant order queue, dish preparation tracking, and table fulfillment.",
};

export default async function RestaurantAdminPage() {
  let orders = [];
  try {
    orders = await getKitchenOrdersAdmin();
  } catch (err) {
    return (
      <div className="ad-content">
        <h1 className="ad-title">Kitchen Ticket Board</h1>
        <div className="err mt-4">{err.message}</div>
      </div>
    );
  }

  return (
    <div className="ad-content">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <span className="eyebrow">Culinary Operations</span>
          <h1 className="ad-title text-2xl md:text-3xl">Kitchen Ticket Board</h1>
          <p className="text-stone-500 text-xs mt-1">
            Real-time live queue of a la carte orders and table pre-orders at The Dining Room.
          </p>
        </div>
      </div>

      <KitchenBoard initialOrders={orders} />
    </div>
  );
}
