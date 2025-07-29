import express from "express";
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import { promisify } from "util";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const PORT = Number(process.env.PORT) || 4000;

sqlite3.verbose();
const db = new sqlite3.Database("data.db");

const runAsync = (sql: string, params: any[] = []) =>
  new Promise<void>((res, rej) => {
    db.run(sql, params, (err) => (err ? rej(err) : res()));
  });

const getAsync = <T = any>(sql: string, params: any[] = []) =>
  new Promise<T>((res, rej) => {
    db.get(sql, params, (err, row) => (err ? rej(err) : res(row as T)));
  });

const allAsync = <T = any[]>(sql: string, params: any[] = []) =>
  new Promise<T>((res, rej) => {
    db.all(sql, params, (err, rows) => (err ? rej(err) : res(rows as T)));
  });

(async () => {
  await runAsync(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    pass_hash TEXT NOT NULL)`);

  await runAsync(`CREATE TABLE IF NOT EXISTS puzzle_progress (
    user_id INTEGER NOT NULL,
    puzzle_id TEXT NOT NULL,
    solved INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, puzzle_id),
    FOREIGN KEY (user_id) REFERENCES users(id))`);
})();

interface JwtPayload { username: string }

const app = express();
app.use(express.json());
app.use(cors());

function authMiddleware(req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.sendStatus(401);
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    return res.sendStatus(401);
  }
}

app.post("/signup", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });
  try {
    const hash = await bcrypt.hash(password, 10);
    await runAsync("INSERT INTO users (username, pass_hash) VALUES (?, ?)", [username, hash]);
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token });
  } catch (e: any) {
    if (e.code === "SQLITE_CONSTRAINT") return res.status(409).json({ error: "Username exists" });
    console.error(e);
    res.status(500).json({ error: "Server" });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });
  const row = await getAsync<{ pass_hash: string }>("SELECT pass_hash FROM users WHERE username=?", [username]);
  if (!row) return res.status(401).json({ error: "Invalid" });
  const ok = await bcrypt.compare(password, row.pass_hash);
  if (!ok) return res.status(401).json({ error: "Invalid" });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

app.get("/me", authMiddleware, (req: Request & { user?: JwtPayload }, res: Response) => {
  res.json({ username: req.user!.username });
});

app.post("/progress", authMiddleware, async (req: Request & { user?: JwtPayload }, res: Response) => {
  const { puzzleId, solved } = req.body as { puzzleId: string; solved: boolean };
  if (!puzzleId) return res.status(400).json({ error: "Missing puzzleId" });
  const userRow = await getAsync<{ id: number }>("SELECT id FROM users WHERE username=?", [req.user!.username]);
  await runAsync(
    "INSERT INTO puzzle_progress (user_id, puzzle_id, solved) VALUES (?, ?, ?) ON CONFLICT(user_id, puzzle_id) DO UPDATE SET solved=excluded.solved",
    [userRow.id, puzzleId, solved ? 1 : 0]
  );
  res.json({ ok: true });
});

// list solved puzzles for current user
app.get("/progress", authMiddleware, async (req: Request & { user?: JwtPayload }, res: Response) => {
  const rows = await allAsync<{ puzzle_id: string; solved: number }[]>(
    "SELECT puzzle_id FROM puzzle_progress WHERE user_id = (SELECT id FROM users WHERE username=?) AND solved = 1",
    [req.user!.username]
  );
  res.json(rows.map((r) => r.puzzle_id));
});

app.listen(PORT, () => console.log(`API listening on :${PORT}`)); 