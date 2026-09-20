import RoomsManager from "./RoomsManager";
import { adminGetAllRoomTypes } from "./actions";

export const metadata = { title: "Room Management — St. Lachland Hotel Admin" };

export default async function RoomsManagementPage() {
  let roomTypes = [];
  try {
    roomTypes = await adminGetAllRoomTypes();
  } catch (err) {
    return (
      <div className="ad-content">
        <h1 className="ad-title">Room Management</h1>
        <div className="err mt-4">{err.message}</div>
      </div>
    );
  }

  return (
    <div className="ad-content">
      <div className="mb-6">
        <span className="eyebrow">Property Operations</span>
        <h1 className="ad-title text-2xl md:text-3xl">Room Management</h1>
        <p className="text-stone-500 text-xs mt-1">
          Manage room types, rates, images, amenities, and individual physical rooms.
        </p>
      </div>
      <RoomsManager initialRoomTypes={roomTypes} />
    </div>
  );
}
