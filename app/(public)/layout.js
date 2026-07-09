import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { getSession } from "./auth-actions";

export default async function PublicLayout({ children }) {
  const session = await getSession();
  return (
    <>
      <Nav session={session} />
      {children}
      <Footer />
    </>
  );
}
