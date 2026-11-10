import { firstFieldErrors, registerRequestSchema } from "@lamton/shared";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "../components/Alert";
import { Field } from "../components/Field";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useDocumentTitle } from "../lib/documentTitle";

export function RegisterPage() {
  useDocumentTitle("Create a founder account");
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    const parsed = registerRequestSchema.safeParse(input);
    if (!parsed.success) {
      setFields(firstFieldErrors(parsed.error));
      setFormError("Some fields need attention.");
      return;
    }

    setFields({});
    setFormError(null);
    setPending(true);
    try {
      await register(parsed.data);
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fields);
        setFormError(error.message);
      } else {
        setFormError("Could not create the account.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page grid gap-10 py-14 lg:grid-cols-[1fr_28rem] lg:items-start">
      <div>
        <p className="kicker">Founder account</p>
        <h1 className="mt-3 max-w-lg font-display text-5xl">Create a founder account</h1>
        <p className="mt-4 max-w-md leading-7 text-ink-soft">
          This form opens a founder workspace. It cannot request admin access or verified mentor status. Those roles are assigned by the platform, not by the person signing up.
        </p>
      </div>
      <form
        className="grid gap-5 rounded-[2rem] border border-line bg-white p-6 sm:p-8"
        onSubmit={onSubmit}
        noValidate
        aria-busy={pending}
      >
        {formError ? <Alert>{formError}</Alert> : null}
        <Field id="name" name="name" label="Name" autoComplete="name" error={fields.name} />
        <Field id="email" name="email" type="email" label="Email" autoComplete="email" error={fields.email} />
        <Field
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          hint="At least 10 characters, with a letter and a number."
          error={fields.password}
        />
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
        <p className="text-sm text-ink-soft">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
