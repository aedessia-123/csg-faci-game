import "./admin.css";
import AdminNav from "./AdminNav";

export const metadata = {
  title: "Admin — The Facilitator Matrix",
};

export default function AdminLayout({ children }) {
  return (
    <div className="admin">
      <AdminNav />
      <main className="admin-main">{children}</main>
    </div>
  );
}
