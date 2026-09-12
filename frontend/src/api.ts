import { Platform } from "react-native";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
export const API = `${BASE}/api`;

// Resolve a stored media reference to a full URL. Full http(s) URLs pass
// through; storage paths (e.g. "bigsmedia/uploads/...") are served via /files.
export function mediaUrl(ref: string): string {
  if (!ref) return ref;
  if (ref.startsWith("http://") || ref.startsWith("https://")) return ref;
  return `${API}/files/${ref}`;
}

export type Service = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  image_url: string;
  features: string[];
};

export type Beat = {
  id: string;
  title: string;
  genre: string;
  tempo: string;
  price?: string;
  preview_url?: string;
  published: boolean;
  created_at: string;
};

export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string;
  year?: string;
  published: boolean;
  created_at: string;
};

export type Quote = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service_type: string;
  budget?: string;
  message: string;
  status: string;
  created_at: string;
};

export type Appointment = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service_type: string;
  date: string;
  time: string;
  notes?: string;
  status: string;
  created_at: string;
};

async function handle(res: Response) {
  if (!res.ok) {
    let detail = "Une erreur est survenue";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json();
}

// ---- Public ----
export async function getServices(): Promise<Service[]> {
  return handle(await fetch(`${API}/services`));
}

export async function getPortfolio(): Promise<Project[]> {
  return handle(await fetch(`${API}/portfolio`));
}

export async function getBeats(): Promise<Beat[]> {
  return handle(await fetch(`${API}/beats`));
}

export async function getProject(id: string): Promise<Project> {
  return handle(await fetch(`${API}/portfolio/${id}`));
}

export async function createQuote(payload: {
  name: string;
  email: string;
  phone?: string;
  service_type: string;
  budget?: string;
  message: string;
}): Promise<Quote> {
  return handle(
    await fetch(`${API}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function createAppointment(payload: {
  name: string;
  email: string;
  phone?: string;
  service_type: string;
  date: string;
  time: string;
  notes?: string;
}): Promise<Appointment> {
  return handle(
    await fetch(`${API}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

// ---- Auth ----
export async function apiLogin(email: string, password: string): Promise<{ access_token: string; email: string }> {
  return handle(
    await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
}

// ---- Admin (token) ----
function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function getMe(token: string) {
  return handle(await fetch(`${API}/auth/me`, { headers: authHeaders(token) }));
}

export async function getStats(token: string) {
  return handle(await fetch(`${API}/admin/stats`, { headers: authHeaders(token) }));
}

export async function getAdminQuotes(token: string): Promise<Quote[]> {
  return handle(await fetch(`${API}/admin/quotes`, { headers: authHeaders(token) }));
}

export async function updateQuoteStatus(token: string, id: string, status: string): Promise<Quote> {
  return handle(
    await fetch(`${API}/admin/quotes/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    }),
  );
}

export async function getAdminAppointments(token: string): Promise<Appointment[]> {
  return handle(await fetch(`${API}/admin/appointments`, { headers: authHeaders(token) }));
}

export async function updateAppointmentStatus(token: string, id: string, status: string): Promise<Appointment> {
  return handle(
    await fetch(`${API}/admin/appointments/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    }),
  );
}

export async function getAdminProjects(token: string): Promise<Project[]> {
  return handle(await fetch(`${API}/admin/portfolio`, { headers: authHeaders(token) }));
}

export async function createProject(
  token: string,
  payload: { title: string; category: string; description: string; image_url: string; year?: string; published?: boolean },
): Promise<Project> {
  return handle(
    await fetch(`${API}/admin/portfolio`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteProject(token: string, id: string) {
  return handle(await fetch(`${API}/admin/portfolio/${id}`, { method: "DELETE", headers: authHeaders(token) }));
}

export async function getAdminBeats(token: string): Promise<Beat[]> {
  return handle(await fetch(`${API}/admin/beats`, { headers: authHeaders(token) }));
}

export async function createBeat(
  token: string,
  payload: { title: string; genre: string; tempo: string; price?: string; preview_url?: string; published?: boolean },
): Promise<Beat> {
  return handle(
    await fetch(`${API}/admin/beats`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteBeat(token: string, id: string) {
  return handle(await fetch(`${API}/admin/beats/${id}`, { method: "DELETE", headers: authHeaders(token) }));
}

// Upload a file to object storage via the backend. Returns the stored path.
export async function uploadFile(
  token: string,
  file: { uri: string; name: string; type: string },
): Promise<{ path: string; content_type: string }> {
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(file.uri)).blob();
    form.append("file", blob, file.name);
  } else {
    // @ts-expect-error React Native FormData file shape
    form.append("file", { uri: file.uri, name: file.name, type: file.type });
  }
  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    if (res.status === 402) throw new Error("Quota de stockage épuisé");
    throw new Error("Échec de l'envoi du fichier");
  }
  return res.json();
}
