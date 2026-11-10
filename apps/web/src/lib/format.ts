export function givenName(name: string): string {
  const [first] = name.trim().split(/\s+/);
  return first || name;
}

export function formatJoined(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function roleLabel(role: "founder" | "mentor" | "admin"): string {
  switch (role) {
    case "founder":
      return "Founder";
    case "mentor":
      return "Verified mentor";
    case "admin":
      return "Admin";
  }
}

export function stateLabel(state: "active" | "suspended"): string {
  return state === "active" ? "Active" : "Suspended";
}
