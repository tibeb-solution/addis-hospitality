"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function RequiredPasswordSetup({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({
      password,
      data: { password_set: true },
    });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="required-password-title" className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl">
        <div className="space-y-2">
          <h2 id="required-password-title" className="text-xl font-semibold">Create your login password</h2>
          <p className="text-sm text-muted-foreground">Your account was created with Google. Set a password now so you can also log in with your email and password.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="required-password" className="text-sm font-medium">Password</label>
            <input id="required-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} minLength={8} required autoFocus className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" />
          </div>
          <div className="space-y-2">
            <label htmlFor="required-password-confirm" className="text-sm font-medium">Confirm password</label>
            <input id="required-password-confirm" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={loading} minLength={8} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" />
          </div>
          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Saving password..." : "Set password and continue"}</Button>
        </form>
      </div>
    </div>
  );
}
