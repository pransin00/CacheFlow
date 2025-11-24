import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { hashPassword } from "../../utils/hashUtils";
import useOtp from "../../hooks/useOtp";
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
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({ 
    strength: 'weak', 
    score: 0, 
    criteria: {} 
  });

  const userId = localStorage.getItem("user_id");
  
  // Use OTP hook
  const {
    send: otpSend,
    resend: otpResend,
    verify: otpVerify,
    resendDisabled,
    resendTimer,
    lockRemaining
  } = useOtp({ prefix: 'cf_reset_password' });

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    const criteria = {
      hasMinLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(criteria).filter(Boolean).length;
    let strength = 'weak';
    
    if (score >= 4) strength = 'strong';
    else if (score >= 3) strength = 'medium';

    return { strength, score, criteria };
  };

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

      // Send OTP using hook
      const res = await otpSend([contact]);
      if (res.ok) {
        setShowOtpModal(true);
        setStep("otp");
        setOtpError("");
      } else {
        setError(res.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Reset password verify error", err);
      setError(err?.message || "Failed to verify current password");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (enteredOtp) => {
    const res = await otpVerify(enteredOtp);
    if (res.ok) {
      setShowOtpModal(false);
      setOtpError("");
      setStep("set");
    } else if (res.locked) {
      setOtpError(`Too many attempts. Try again in ${res.remaining}s`);
    } else {
      setOtpError(res.message || "Invalid OTP");
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    const { data: user } = await supabase
      .from("users")
      .select("contact_number")
      .eq("id", userId)
      .maybeSingle();
    const contact = user?.contact_number;
    if (!contact) {
      setOtpError("No contact number on file");
      return;
    }
    const res = await otpResend([contact]);
    if (res.locked) {
      setOtpError("Too many attempts. Please wait.");
    } else if (res.cooldown) {
      setOtpError("Please wait before resending");
    } else if (!res.ok) {
      setOtpError(res.message || "Failed to resend OTP");
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
      const hashedPassword = await hashPassword(next);
      const { error: updateErr } = await supabase
        .from("users")
        .update({ password: hashedPassword })
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
            <div className="rp-input-wrapper">
              <input
                className="rp-input"
                type={showCurrentPassword ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
              <button
                type="button"
                className="rp-eye-btn"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label="Toggle password visibility"
              >
                {showCurrentPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
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
        isOpen={showOtpModal && step === "otp"}
        onClose={() => {
          setShowOtpModal(false);
          setOtpError("");
          setStep("verify");
        }}
        onVerify={handleVerifyOtp}
        error={otpError}
        onResend={handleResendOtp}
        resendDisabled={resendDisabled}
        timer={resendTimer}
      />

      <Modal isOpen={step === "set"} onClose={onClose}>
        <form onSubmit={handleSetPassword} className="rp-form">
          <h3 className="rp-title">Set new password</h3>
          <div className="rp-group">
            <label className="rp-label">New password</label>
            <div className="rp-input-wrapper">
              <input
                className="rp-input"
                type={showNewPassword ? "text" : "password"}
                value={next}
                onChange={(e) => {
                  setNext(e.target.value);
                  setPasswordStrength(calculatePasswordStrength(e.target.value));
                }}
              />
              <button
                type="button"
                className="rp-eye-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label="Toggle password visibility"
              >
                {showNewPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            
            {/* Password Requirements */}
            <div className="rp-password-requirements">
              <p className="rp-requirements-title">Password must contain:</p>
              <ul className="rp-requirements-list">
                <li className={passwordStrength.criteria.hasMinLength ? 'met' : ''}>
                  At least 8 characters
                </li>
                <li className={passwordStrength.criteria.hasUpper ? 'met' : ''}>
                  One uppercase letter (A-Z)
                </li>
                <li className={passwordStrength.criteria.hasLower ? 'met' : ''}>
                  One lowercase letter (a-z)
                </li>
                <li className={passwordStrength.criteria.hasNumber ? 'met' : ''}>
                  One number (0-9)
                </li>
                <li className={passwordStrength.criteria.hasSymbol ? 'met' : ''}>
                  One special character (!@#$%^&*...)
                </li>
              </ul>
            </div>

            {/* Password Strength Indicator */}
            {next && (
              <div className="rp-strength-indicator">
                <div className="rp-strength-label">
                  Password Strength: <span className={`rp-strength-${passwordStrength.strength}`}>
                    {passwordStrength.strength.toUpperCase()}
                  </span>
                </div>
                <div className="rp-strength-bar">
                  <div 
                    className={`rp-strength-fill rp-strength-${passwordStrength.strength}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <div className="rp-group">
            <label className="rp-label">Confirm new password</label>
            <div className="rp-input-wrapper">
              <input
                className="rp-input"
                type={showConfirmPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button
                type="button"
                className="rp-eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle password visibility"
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
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
