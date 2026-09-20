import { getSession } from "../auth-actions";
import EventPlanner from "./EventPlanner";

export const metadata = {
  title: "Plan Your Event — St. Lachland Hotel",
};

export default async function EventsPage({ searchParams }) {
  const session = await getSession();
  return (
    <EventPlanner
      loggedIn={!!session}
      customerName={session?.name || null}
      initialEventType={searchParams?.event_type || ""}
      initialEventDate={searchParams?.event_date || ""}
      initialGuests={searchParams?.guests ? Number(searchParams.guests) : null}
      initialBudget={searchParams?.budget ? Number(searchParams.budget) : null}
    />
  );
}
