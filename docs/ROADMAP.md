# Lamton roadmap

Lamton is an entrepreneurship and mentorship platform for Bhutan. Founders keep a record of the work. Verified mentors continue that record. Later, AI-guided research and agentic workflows help a founder prepare for the next conversation.

Nine phases. Only Phase 1 is in this repository. Later phases are not started, and their integrations are intentionally absent.

## Phase 1 — Foundation and accounts

A monorepo, a real MongoDB API, founder registration, server-side sessions, role guards, an admin provisioning command, and the public and signed-in web app.

Public signup creates a founder only. Admin accounts come from a server command. Mentor access is a protected route with no way to grant it from the signup form.

## Phase 2 — Founder profile and venture workspace

Persist the venture itself: description, stage, location, goals, and notes the founder can return to. Replace the empty venture panel with saved records. Still no fake metrics and no mentor assignment.

## Phase 3 — Mentor verification

A mentor application reviewed by an admin. The mentor role is granted only by a server-side decision after review. Founders are not asked to apply as mentors in order to register. No fabricated mentor profiles.

## Phase 4 — Mentorship matching and continuity

A founder can request guidance. A verified mentor can accept. The relationship, decisions, and follow-ups stay attached to the venture so a later session starts from the last decision.

## Phase 5 — AI-guided business research

Grounded research for a saved venture: sources, summaries, and open questions the founder can keep. This is the first phase that may call an external model or search API. Nothing in Phase 1 calls one.

## Phase 6 — Agentic guidance

Multi-step workflows that plan research, draft questions for a mentor, and write the result back onto the venture. The founder can see what the workflow did. It does not invent mentors or metrics.

## Phase 7 — Coordination

Messages, check-ins, and notifications between a founder and a verified mentor. Reminders point at saved work. They do not pretend a relationship exists.

## Phase 8 — Trust, safety, and admin operations

Suspend and restore accounts from the admin workspace, review mentor applications, and keep an audit trail of role changes. Public endpoints still cannot grant admin or mentor access.

## Phase 9 — Production launch

Hosting, backups, monitoring, a security and accessibility pass, and the operational checklist for a Bhutan-facing launch. Rate limits, cookie settings, and database failure behavior from Phase 1 stay in place.

## Explicitly out of Phase 1

- Groq, LangGraph, Tavily, or any other model or search provider
- Mentor applications and verification
- Venture records beyond the empty state
- Messaging, notifications, and scheduling
- JSON or file storage as a stand-in for MongoDB
