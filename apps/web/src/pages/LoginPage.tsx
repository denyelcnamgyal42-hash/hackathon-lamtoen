import { firstFieldErrors, loginRequestSchema } from "@lamton/shared";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "../components/Alert";
import { Field } from "../components/Field";
import { ApiError } from "../lib/api";
import { homeForRole, useAuth } from "../lib/auth";
import { useDocumentTitle } from "../lib/documentTitle";

export function LoginPage() {
  useDocumentTitle("Sign in");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    const parsed = loginRequestSchema.safeParse(input);
    if (!parsed.success) {
      setFields(firstFieldErrors(parsed.error));
      setFormError("Some fields need attention.");
      return;
    }

    setFields({});
    setFormError(null);
    setPending(true);
    try {
      const user = await login(parsed.data);
      navigate(homeForRole(user.role));
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fields);
        setFormError(error.message);
      } else {
        setFormError("Could not sign in.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page grid gap-10 py-14 lg:grid-cols-[1fr_28rem] lg:items-start">
      <div>
        <p className="kicker">Welcome back</p>
        <h1 className="mt-3 font-display text-5xl">Sign in</h1>
        <p className="mt-4 max-w-md leading-7 text-ink-soft">
          Use the email and password from your Lamton account. A founder returns to the founder workspace. An admin returns to administration.
        </p>
      </div>
      <form className="grid gap-5 rounded-[2rem] border border-line bg-white p-6 sm:p-8" onSubmit={onSubmit} noValidate aria-busy={pending}>
        {formError ? <Alert>{formError}</Alert> : null}
        <Field id="email" name="email" type="email" label="Email" autoComplete="email" error={fields.email} />
        <Field
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          error={fields.password}
        />
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-ink-soft">
          New to Lamton?{" "}
          <Link to="/register" className="font-semibold text-brand">
            Create a founder account
          </Link>
        </p>
      </form>
    </div>
  );
}
