import { redirect } from "next/navigation";
import { getSession, logout } from "../auth-actions";
import { getMyBookings, getMyPreferenceVector } from "../events/actions";
import { fetchMyStayBookings } from "../rooms/actions";
import { fetchMyDiningReservations } from "../dining/actions";
import AccountPortal from "./AccountPortal";

export const metadata = {
  title: "Guest Portfolio & Account — St. Lachland Hotel",
  description: "Manage your luxury sanctuary stays, AI-planned event celebrations, and table dining reservations.",
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  const [eventBookings, stayBookings, diningReservations, userPrefs] = await Promise.all([
    getMyBookings(),
    fetchMyStayBookings(),
    fetchMyDiningReservations(),
    getMyPreferenceVector(),
  ]);

  async function doLogout() {
    "use server";
    await logout();
    redirect("/login");
  }

  return (
    <main className="account-page py-12">
      <div className="wrap">
        <AccountPortal
          session={session}
          stayBookings={stayBookings}
          eventBookings={eventBookings}
          diningReservations={diningReservations}
          userPrefs={userPrefs}
          doLogout={doLogout}
        />
      </div>
    </main>
  );
}
