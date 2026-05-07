// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    const res = await register(form);
    if (res.success) navigate("/assessment");
    else setError(res.error);
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="page page--auth">
      <Link to="/" className="nav__brand">
        <span className="nav__cross">+</span> RemoTriage
      </Link>

      <div className="auth-card">
        <h1>Create account</h1>
        <p className="muted">Optional — assessment works without an account</p>

        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form__group">
            <label>Full Name</label>
            <input className="form__input" type="text" value={form.name} onChange={set("name")} required />
          </div>
          <div className="form__group">
            <label>Email</label>
            <input className="form__input" type="email" value={form.email} onChange={set("email")} required />
          </div>
          <div className="form__group">
            <label>Phone (optional)</label>
            <input className="form__input" type="tel" value={form.phone} onChange={set("phone")} placeholder="+254..." />
          </div>
          <div className="form__group">
            <label>Password</label>
            <input className="form__input" type="password" value={form.password} onChange={set("password")} required minLength={8} />
          </div>
          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}