import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

type Props = { onSuccess?: () => void; initialMode?: "login" | "signup" };

const AuthForm: React.FC<Props> = ({ onSuccess, initialMode = "login" }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const action = mode === "login" ? login : signup;
    const err = await action(username.trim(), password);
    if (err) setError(err);
    else if (onSuccess) onSuccess();
  };

  return (
    <div className="auth-form">
      <h2>{mode === "login" ? "Log In" : "Create Account"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="primary-btn">{mode === "login" ? "Log In" : "Sign Up"}</button>
      </form>
      <button className="link" onClick={() => setMode(mode === "login" ? "signup" : "login")}> 
        {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
      </button>
    </div>
  );
};

export default AuthForm; 