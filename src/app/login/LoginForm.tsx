"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/FormBits";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <div>
        <label htmlFor="username" className="label">
          Username
        </label>
        <input
          id="username"
          name="username"
          className="input"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-gold w-full" pending="Memeriksa…">
        Masuk
      </SubmitButton>
    </form>
  );
}

