"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { updateAvatar, type AvatarActionState } from "@/app/profile/actions";
import { Avatar } from "@/components/ui/avatar";

function ChangePhotoOverlay() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-transparent transition-colors hover:bg-black/40 hover:text-white disabled:cursor-not-allowed"
      aria-hidden
      tabIndex={-1}
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
    </button>
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
  const inputRef = useRef<HTMLInputElement>(null);

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
      <form ref={formRef} action={formAction} className="relative">
        <label htmlFor="avatar" className="group relative block cursor-pointer">
          <Avatar src={displayUrl} name={name} email={email} size="lg" />
          <ChangePhotoOverlay />
        </label>
        <input
          ref={inputRef}
          id="avatar"
          name="avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
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
