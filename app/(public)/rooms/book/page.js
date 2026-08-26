import { redirect } from "next/navigation";
import { getSession } from "../../auth-actions";
import { getRoomTypes } from "../../../../lib/rooms";
import BookingCheckout from "./BookingCheckout";

export const metadata = {
  title: "Sanctuary Reservation Checkout — St. Lachland Hotel",
  description: "Secure your luxury room or suite reservation at St. Lachland Hotel, Nuwara Eliya.",
};

export default async function RoomBookingPage({ searchParams }) {
  const session = await getSession();
  const roomTypes = await getRoomTypes();

  return (
    <main className="room-booking-page py-16">
      <div className="wrap">
        <BookingCheckout
          roomTypes={roomTypes}
          initialRoomTypeId={searchParams?.roomTypeId}
          initialCheckIn={searchParams?.checkIn}
          initialCheckOut={searchParams?.checkOut}
          session={session}
        />
      </div>
    </main>
  );
}
