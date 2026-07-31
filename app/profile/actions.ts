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
