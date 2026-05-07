// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(form.email, form.password);
    if (res.success) navigate("/assessment");
    else setError(res.error);
  };

  return (
    <div className="page page--auth">
      <Link to="/" className="nav__brand">
        <span className="nav__cross">+</span> RemoTriage
      </Link>

      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Sign in to save your assessment history</p>

        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form__group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form__input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />
          </div>
          <div className="form__group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form__input"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-card__footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <p className="auth-card__footer">
          <Link to="/assessment">Continue without account →</Link>
        </p>
      </div>
    </div>
  );
}