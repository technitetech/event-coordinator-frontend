import { redirect } from "next/navigation";
import { getSession } from "../../(public)/auth-actions";
import AdminSidebar from "./AdminSidebar";

// Server-side guard: reads the real session and checks role === 'admin'.
// No hardcoded password check here — the role comes from the users table.
export default async function PanelLayout({ children }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  return (
    <div className="ad-shell">
      <AdminSidebar name={session.name} />
      <main className="ad-main">{children}</main>
    </div>
  );
}
