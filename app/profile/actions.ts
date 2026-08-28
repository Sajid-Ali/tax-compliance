"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { type ActionState, zodFieldErrors } from "@/lib/action-state";

const nameSchema = z.object({
  full_name: z.string().min(2, "Enter your full name."),
});

export async function updateName(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You've been signed out — refresh and sign in again." };

  const parsed = nameSchema.safeParse({ full_name: formData.get("full_name") });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    actorUserId: user.id,
    action: "profile_name_updated",
    entity: "profiles",
    entityId: user.id,
    after: parsed.data,
  });

  revalidatePath("/profile");
  return { success: true, message: "Name updated." };
}

// E.164 check: leading +, 8-15 digits. The + is required (not optional) —
// Twilio's `to` param requires E.164, and a bare local-format number like
// "03001234567" would pass a looser regex but fail at send time in the
// cron, silently dropping that client's SMS reminders.
const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      /^\+[0-9]{8,15}$/,
      "Enter a valid phone number in international format, e.g. +923001234567."
    )
    .optional()
    .or(z.literal("")),
});

export async function updatePhone(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You've been signed out — refresh and sign in again." };

  const parsed = phoneSchema.safeParse({ phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const phone = parsed.data.phone || null;
  const { error } = await supabase.from("profiles").update({ phone }).eq("id", user.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    actorUserId: user.id,
    action: "profile_phone_updated",
    entity: "profiles",
    entityId: user.id,
    after: { phone },
  });

  revalidatePath("/profile");
  return { success: true, message: phone ? "Phone number saved." : "Phone number removed." };
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export type AvatarActionState = (ActionState & { avatarUrl?: string }) | null;

/**
 * Uploads via the ADMIN client (service role) rather than relying on
 * storage.objects RLS policies — those would need a SQL migration the same
 * way has_password did. Safe here because the user's identity is verified
 * server-side first, via the regular RLS-respecting client, before the
 * admin client ever touches storage, and the path is derived from that
 * verified id rather than anything client-supplied.
 */
export async function updateAvatar(
  _prevState: AvatarActionState,
  formData: FormData
): Promise<AvatarActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You've been signed out — refresh and sign in again." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { error: "Use a PNG, JPEG, WebP, or GIF image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Image must be under 5MB." };
  }

  const ext = file.type.split("/")[1] ?? "png";
  const path = `${user.id}/avatar.${ext}`;
  const admin = createAdminClient();

  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await admin.storage
    .from("avatars")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (uploadErr) return { error: uploadErr.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so the new photo shows immediately instead of the old one
  // lingering under a browser/CDN cache keyed on the same path.
  const bustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: metaErr } = await supabase.auth.updateUser({
    data: { avatar_url: bustedUrl },
  });
  if (metaErr) return { error: metaErr.message };

  await logAudit(supabase, {
    actorUserId: user.id,
    action: "profile_avatar_updated",
    entity: "profiles",
    entityId: user.id,
  });

  revalidatePath("/profile");
  return { success: true, message: "Profile photo updated.", avatarUrl: bustedUrl };
}
