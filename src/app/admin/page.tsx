import type { Metadata } from "next";
import AdminClient from "@/components/admin/AdminClient";

export const metadata: Metadata = {
  title: "Admin",
  description: "Upload and manage outfits.",
};

export default function AdminPage() {
  return <AdminClient />;
}
