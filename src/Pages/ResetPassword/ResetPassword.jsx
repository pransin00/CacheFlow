import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import Modal from "../../Modals/Modal/Modal";
import OtpModal from "../../Modals/OtpModal/OtpModal";
import "./ResetPassword.css";

export default function ResetPassword({ onClose, onSuccess }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP step state
  const [step, setStep] = useState("verify"); // 'verify' | 'otp' | 'set'
  const [sentOtp, setSentOtp] = useState("");
  const [timer, setTimer] = useState(45);

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (step === "otp" && timer > 0) {
      const iv = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(iv);
    }
  }, [step, timer]);

  const verifyCurrent = async (e) => {
    e && e.preventDefault();
    setError("");
    if (!userId) return setError("No user logged in");
    if (!current) return setError("Please enter your current password");

    setLoading(true);
    try {
      // Verify current password
      const { data: user, error: fetchErr } = await supabase
        .from("users")
        .select("password, contact_number")
        .eq("id", userId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      const stored = user?.password || "";
      if (String(stored) !== String(current)) {
        setError("Current password is incorrect");
        setLoading(false);
        return;
      }

      const contact = user?.contact_number;
      if (!contact) {
        setError("No contact number on file to send OTP");
        setLoading(false);
        return;
      }

      // send OTP to user's contact
      try {
        const resp = await fetch("http://localhost:3001/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumbers: [contact] }),
        });
        const json = await resp.json();
        if (resp.ok && json.otp) {
          setSentOtp(String(json.otp));
          setTimer(45);
          setStep("otp");
        } else {
          const msg = json?.error || "Failed to send OTP";
          setError(msg);
        }
      } catch (e) {
        console.error("OTP send error", e);
        setError("Failed to send OTP");
      }
    } catch (err) {
      console.error("Reset password verify error", err);
      setError(err?.message || "Failed to verify current password");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (enteredOtp) => {
    setError("");
    const entered = String(enteredOtp || "").trim();
    if (!entered || entered.length !== 6)
      return setError("Enter the 6-digit code");
    if (entered !== (sentOtp || "").toString().trim())
      return setError("Invalid code");

    // OTP verified — proceed to set new password step
    setStep("set");
  };

  const handleResend = async () => {
    setError("");
    try {
      // re-fetch contact just in case
      const { data: user } = await supabase
        .from("users")
        .select("contact_number")
        .eq("id", userId)
        .maybeSingle();
      const contact = user?.contact_number;
      if (!contact) return setError("No contact number on file");
      const resp = await fetch("http://localhost:3001/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumbers: [contact] }),
      });
      const json = await resp.json();
      if (resp.ok && json.otp) {
        setSentOtp(String(json.otp));
        setTimer(45);
      } else {
        setError(json?.error || "Failed to resend OTP");
      }
    } catch (e) {
      console.error("Resend OTP error", e);
      setError("Failed to resend OTP");
    }
  };

  const handleSetPassword = async (e) => {
    e && e.preventDefault();
    setError("");
    if (!next || !confirm) return setError("Please fill all fields");
    if (next !== confirm) return setError("New passwords do not match");
    if (next.length < 6)
      return setError("New password must be at least 6 characters");

    setLoading(true);
    try {
      const { error: updateErr } = await supabase
        .from("users")
        .update({ password: next })
        .eq("id", userId);
      if (updateErr) throw updateErr;
      onSuccess && onSuccess(next);
      onClose && onClose();
    } catch (err) {
      console.error("Set password error", err);
      setError(err?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={step === "verify"} onClose={onClose}>
        <form onSubmit={verifyCurrent} className="rp-form">
          <h3 className="rp-title">Verify current password</h3>
          <div className="rp-group">
            <label className="rp-label">Current password</label>
            <input
              className="rp-input"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          {error && <div className="rp-error">{error}</div>}
          <div className="rp-actions">
            <button
              type="button"
              onClick={() => onClose && onClose()}
              className="rp-btn rp-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rp-btn rp-primary"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>
        </form>
      </Modal>

      <OtpModal
        isOpen={step === "otp"}
        onClose={() => setStep("verify")}
        onVerify={handleVerifyOtp}
        error={error}
        onResend={handleResend}
        resendDisabled={timer !== 0}
        timer={timer}
      />

      <Modal isOpen={step === "set"} onClose={onClose}>
        <form onSubmit={handleSetPassword} className="rp-form">
          <h3 className="rp-title">Set new password</h3>
          <div className="rp-group">
            <label className="rp-label">New password</label>
            <input
              className="rp-input"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="rp-group">
            <label className="rp-label">Confirm new password</label>
            <input
              className="rp-input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <div className="rp-error">{error}</div>}
          <div className="rp-actions">
            <button
              type="button"
              onClick={() => {
                setStep("verify");
              }}
              className="rp-btn rp-cancel"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rp-btn rp-primary"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
