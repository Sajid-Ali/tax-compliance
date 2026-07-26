import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function RootPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin/filing-queue");
  if (profile.role === "reviewer") redirect("/review-queue");
  redirect("/dashboard");
}
