import { getSession } from "../../auth-actions";
import ReservationForm from "./ReservationForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Table Reservation — St. Lachland Restaurant",
  description: "Reserve your table at The Dining Room or Garden Terrace at St. Lachland Hotel.",
};

export default async function TableReservationPage({ searchParams }) {
  const session = await getSession();

  return (
    <main className="table-reservation-page py-12">
      <div className="wrap">
        <Link href="/dining" className="inline-flex items-center gap-2 text-xs text-mist hover:text-emerald mb-6">
          <ArrowLeft size={14} />
          <span>Back to Dining</span>
        </Link>

        <ReservationForm
          session={session}
          initialDate={searchParams?.date}
          initialCovers={searchParams?.covers}
        />
      </div>
    </main>
  );
}
