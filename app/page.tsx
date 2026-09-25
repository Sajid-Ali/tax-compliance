import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { LandingPage } from "@/components/landing/landing-page";

export default async function RootPage() {
  const profile = await getCurrentProfile();
  if (!profile) return <LandingPage />;
  if (profile.role === "admin") redirect("/admin/filing-queue");
  if (profile.role === "reviewer") redirect("/review-queue");
  redirect("/dashboard");
}
