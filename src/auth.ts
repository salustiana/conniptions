// auth utility functions hitting backend API

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const TOKEN_KEY = "conn_token";
const USER_KEY = "conn_user";

export async function createUser(username: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, username);
      return null;
    }
    if (res.status === 409) return "Username already exists";
    return "Error creating account";
  } catch {
    return "Network error";
  }
}

export async function authenticate(username: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, username);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function setCurrentUser(username: string | null) {
  if (username) localStorage.setItem(USER_KEY, username);
  else localStorage.removeItem(USER_KEY);
}

export function getCurrentUser(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
} 
