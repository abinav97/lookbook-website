import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminClient from "@/components/admin/AdminClient";

export const metadata: Metadata = {
  title: "Admin",
  description: "Upload and manage outfits.",
  robots: { index: false, follow: false },
};

/**
 * The tagging tool is a local authoring aid. It is only built when
 * ENABLE_ADMIN=true is set at build time (e.g. `ENABLE_ADMIN=true npm run dev`);
 * production exports render a 404 here so no API-key UI ships publicly.
 */
export default function AdminPage() {
  if (process.env.ENABLE_ADMIN !== "true") notFound();
  return <AdminClient />;
}
