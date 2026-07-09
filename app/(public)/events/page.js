import { getSession } from "../auth-actions";
import EventPlanner from "./EventPlanner";

export default async function EventsPage() {
  const session = await getSession();
  return <EventPlanner loggedIn={!!session} customerName={session?.name || null} />;
}
