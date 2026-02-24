import type { Metadata } from "next";
import AboutClient from "@/components/about/AboutClient";

export const metadata: Metadata = {
  title: "About",
  description: "About Abi and this living lookbook project.",
};

export default function AboutPage() {
  return <AboutClient />;
}
