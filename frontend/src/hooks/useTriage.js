// src/hooks/useTriage.js
import { useState } from "react";
import { triageAPI } from "../services/api";

export function useTriage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAssessment = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await triageAPI.runAssessment(formData);
      setResult(res.data);
      // Cache in session storage for Results page
      sessionStorage.setItem("remo_last_result", JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || "Assessment failed. Please try again.";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
    sessionStorage.removeItem("remo_last_result");
  };

  return { result, loading, error, runAssessment, clearResult };
}