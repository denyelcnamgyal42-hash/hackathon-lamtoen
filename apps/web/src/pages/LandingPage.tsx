import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/documentTitle";
import { homeForRole, useAuth } from "../lib/auth";

const journey = [
  {
    step: "01",
    title: "Open a founder account",
    body: "Register with your name, email, and a password you choose. Signup does not ask you to apply as a mentor. The account created here is a founder account.",
  },
  {
    step: "02",
    title: "Return to the same workspace",
    body: "Your session brings you back to the record that belongs to you: your name, your role, and the date you joined. There is no sample company waiting on the page.",
  },
  {
    step: "03",
    title: "Carry guidance forward",
    body: "The later work of Lamton is a venture record that a verified mentor can continue. That continuity is the point of the platform. It is not switched on in this release.",
  },
];

export function LandingPage() {
  useDocumentTitle("Lamton");
  const { user } = useAuth();

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 42% 70% at 100% 0%, rgba(107, 78, 255, 0.16), transparent 58%), radial-gradient(ellipse 36% 46% at 0% 100%, rgba(46, 125, 107, 0.16), transparent 52%)",
          }}
        />
        <div className="page relative grid items-end gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="rise">
            <p className="kicker">Bhutan · founders and mentors</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.02] text-ink sm:text-6xl">
              Guidance that stays with the venture.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
              Lamton is an entrepreneurship and mentorship platform for Bhutan. A founder keeps a record of the work.
              A verified mentor, once the platform grants that access, continues from the same record instead of starting over.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link to={homeForRole(user.role)} className="btn btn-primary">
                  Go to your workspace
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">
                    Create a founder account
                    <ArrowRight aria-hidden="true" size={18} />
                  </Link>
                  <Link to="/login" className="btn btn-secondary">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
          <aside className="rounded-[2rem] border border-line bg-white p-6 shadow-[0_24px_60px_rgba(23,32,51,0.06)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">What an account holds</p>
            <h2 className="mt-3 font-display text-3xl">Only what has been saved.</h2>
            <dl className="mt-6 grid gap-4">
              <Record label="Name and email" value="Taken from registration. Never a sample person." />
              <Record label="Role" value="Public signup grants founder access, and nothing else." />
              <Record label="Venture, mentor, research" value="Empty until those parts of Lamton exist. They are not filled with placeholders." />
            </dl>
          </aside>
        </div>
      </section>

      <section id="purpose" className="border-t border-line bg-brand text-paper">
        <div className="page grid gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d7deef]">Purpose</p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Built for the long conversation.</h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-[#e7ebf6]">
            <p>
              Founders in Bhutan often gather advice across visits, introductions, and chats that disappear. The useful part is rarely the first remark. It is the decision that follows, and whether anyone can find it again.
            </p>
            <p>
              Lamton is the place that holds that thread: who the founder is, what the venture is trying to do, and what has already been decided. The account you open today is the start of that record.
            </p>
          </div>
        </div>
      </section>

      <section id="journey" className="border-t border-line">
        <div className="page py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="kicker">Three steps</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">The founder journey</h2>
            <p className="mt-4 leading-7 text-ink-soft">
              This is the path the product is built around. It is not a progress chart, and it does not claim you have completed work you have not saved.
            </p>
          </div>
          <ol className="mt-10 grid gap-4 lg:grid-cols-3">
            {journey.map((item) => (
              <li key={item.step} className="rounded-[1.7rem] border border-line bg-white p-6">
                <p className="font-display text-3xl text-juniper">{item.step}</p>
                <h3 className="mt-4 font-display text-2xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="mentorship" className="border-t border-line bg-paper-deep">
        <div className="page grid gap-8 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
          <div>
            <p className="kicker">Mentorship continuity</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">Mentorship with a memory.</h2>
            <p className="mt-5 max-w-xl leading-8 text-ink-soft">
              A mentor’s value is the second conversation, and the tenth. Lamton is designed so guidance accumulates: the context stays with the venture, and the next session starts from the last decision rather than from zero.
            </p>
            <p className="mt-4 max-w-xl leading-8 text-ink-soft">
              Verified mentor access is granted by the platform. It is not a checkbox on the registration form, and this release does not assign a mentor to a new founder.
            </p>
          </div>
          <blockquote className="rounded-[2rem] bg-brand-deep px-7 py-8 text-paper">
            <p className="font-display text-3xl leading-tight">“The advice is already happening. The record should not reset.”</p>
            <footer className="mt-6 text-sm text-[#d5dced]">The continuity Lamton is being built to keep.</footer>
          </blockquote>
        </div>
      </section>

      <section id="start" className="border-t border-line">
        <div className="page flex flex-col gap-6 py-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="kicker">Begin</p>
            <h2 className="mt-3 font-display text-4xl">Open a founder account.</h2>
            <p className="mt-4 leading-7 text-ink-soft">
              Registration creates a founder. It does not make you a mentor or an admin. If you already have an account, sign in to the same workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="btn btn-primary">
              Create a founder account
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-line pt-4">
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-ink-soft">{value}</dd>
    </div>
  );
}
