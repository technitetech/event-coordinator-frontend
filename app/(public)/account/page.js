import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, logout } from "../auth-actions";
import { getMyBookings } from "../events/actions";

const fmt = (n) => "LKR " + Number(n).toLocaleString();

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const bookings = await getMyBookings();

  async function doLogout() {
    "use server";
    await logout();
    redirect("/login");
  }

  return (
    <main className="account-page">
      <div className="wrap">
        <div className="account-header">
          <div>
            <span className="eyebrow">My Account</span>
            <h1 className="display">Hello, {session.name.split(" ")[0]}.</h1>
            <p className="account-email">{session.email}</p>
          </div>
          <div className="account-header-actions">
            <Link href="/events" className="btn btn-solid">Plan an event</Link>
            <form action={doLogout}><button className="btn btn-ghost">Log out</button></form>
          </div>
        </div>

        <h2 className="account-subhead">Your reservations</h2>

        {bookings.length === 0 ? (
          <div className="account-empty">
            <p>You haven&rsquo;t reserved any events yet.</p>
            <Link href="/events" className="btn btn-gold">Plan your first event</Link>
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map((b) => {
              let images = [];
              if (b.image_url) {
                try {
                  images = JSON.parse(b.image_url);
                  if (!Array.isArray(images)) images = [b.image_url];
                } catch (e) {
                  images = [b.image_url];
                }
              }

              return (
              <article className="booking-card" key={b.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div className="booking-main">
                    <span className={`tag tag-${b.status}`}>{b.status}</span>
                    <h3>{b.event_type.charAt(0).toUpperCase() + b.event_type.slice(1)}</h3>
                    <p className="booking-meta">
                      {b.event_date} · {b.venue_name || "Venue TBC"} · {b.guests} guests
                    </p>
                  </div>
                  <div className="booking-cost" style={{ textAlign: 'right' }}>
                    <span className="booking-total">{fmt(b.total_cost)}</span>
                    <span className="booking-ref">Ref #{b.id}</span>
                  </div>
                </div>
                {images.length > 0 && (
                  <div style={{ marginTop: '16px', display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '10px' }}>
                    {images.map((img, i) => (
                      <img 
                        key={i} 
                        src={img} 
                        alt={`Event Design ${i+1}`} 
                        style={{ width: '280px', height: '280px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} 
                      />
                    ))}
                  </div>
                )}
              </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
