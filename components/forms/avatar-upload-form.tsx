"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { updateAvatar, type AvatarActionState } from "@/app/profile/actions";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

/**
 * Purely decorative — `pointer-events-none` so clicks pass through to the
 * <label> underneath instead of being swallowed by this overlay. It used to
 * be a `type="submit"` button covering the whole avatar, which intercepted
 * every click before the label could open the file picker: clicking the
 * photo just silently submitted an empty form instead of doing anything.
 */
function ChangePhotoBadge() {
  const { pending } = useFormStatus();
  return (
    <span
      className={cn(
        "pointer-events-none absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-primary text-primary-foreground shadow-elevation-sm transition-transform",
        "group-hover:scale-110"
      )}
      aria-hidden
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Camera className="h-3.5 w-3.5" />
      )}
    </span>
  );
}

export function AvatarUploadForm({
  initialUrl,
  name,
  email,
}: {
  initialUrl: string | null;
  name: string | null;
  email: string | null;
}) {
  const [state, formAction] = useActionState<AvatarActionState, FormData>(updateAvatar, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Derived directly from state during render rather than copied into local
  // state via an effect — state.avatarUrl already IS the latest value once
  // an upload succeeds, so there's nothing to synchronize.
  const displayUrl = state?.success ? (state.avatarUrl ?? initialUrl) : initialUrl;

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      if (state.message) toast.success(state.message);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="flex items-center gap-4">
      <form ref={formRef} action={formAction}>
        <label htmlFor="avatar" className="group relative block w-fit cursor-pointer">
          <Avatar src={displayUrl} name={name} email={email} size="lg" />
          <ChangePhotoBadge />
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={() => formRef.current?.requestSubmit()}
          />
        </label>
      </form>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">Profile photo</p>
        <p className="text-xs text-muted-foreground">
          PNG, JPEG, WebP, or GIF — up to 5MB. Click the photo to change it.
        </p>
      </div>
    </div>
  );
}
