import { redirect } from "next/navigation";
import { UserRound, KeyRound, Phone } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRoleNavConfig } from "@/lib/role-nav";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { AvatarUploadForm } from "@/components/forms/avatar-upload-form";
import { NameForm } from "@/components/forms/name-form";
import { PhoneForm } from "@/components/forms/phone-form";
import { ChangePasswordForm } from "@/components/forms/change-password-form";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Best-effort — degrades to "no password yet" if migration
  // 0005_password_login.sql hasn't been applied, same as elsewhere.
  const { data: passwordFlag } = await supabase
    .from("profiles")
    .select("has_password")
    .eq("id", profile.id)
    .maybeSingle();

  const nav = getRoleNavConfig(profile.role);
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <AppShell {...nav} email={user?.email} avatarUrl={avatarUrl} maxWidth="max-w-2xl">
      <div className="flex flex-col gap-6">
        <PageHeader title="Your profile" description="Manage your name, photo, and password." />

        <Card>
          <CardContent className="pt-5">
            <AvatarUploadForm
              initialUrl={avatarUrl}
              name={profile.full_name}
              email={user?.email ?? null}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionLabel icon={UserRound} label="Name" />
          </CardHeader>
          <CardContent>
            <NameForm defaultName={profile.full_name ?? ""} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionLabel icon={Phone} label="Phone" />
          </CardHeader>
          <CardContent>
            <PhoneForm defaultPhone={profile.phone ?? ""} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <SectionLabel icon={KeyRound} label="Password" />
            <p className="pl-9 text-xs text-muted-foreground">
              Signed in as {user?.email} · {nav.roleLabel}
            </p>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm
              email={user?.email ?? ""}
              hasPassword={passwordFlag?.has_password ?? false}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
