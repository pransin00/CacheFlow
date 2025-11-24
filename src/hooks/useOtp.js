import { useEffect, useRef, useState } from 'react';

// useOtp hook
// options: { prefix, sendEndpoint }
// returns: { send, resend, verify, reset, sentOtp, resendDisabled, resendTimer, lockRemaining, attempts }
export default function useOtp(options = {}) {
  const { prefix = 'cf_otp', sendEndpoint = 'http://localhost:3001/api/send-otp' } = options;
  const attemptsKey = `${prefix}_otp_attempts`;
  const lockKey = `${prefix}_otp_lock_until`;

  const [sentOtp, setSentOtp] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [attempts, setAttempts] = useState(() => parseInt(localStorage.getItem(attemptsKey) || '0', 10));

  const resendIv = useRef(null);
  const lockIv = useRef(null);

  useEffect(() => {
    // initialize lockRemaining from localStorage
    const until = parseInt(localStorage.getItem(lockKey) || '0', 10);
    if (!isNaN(until) && until > Date.now()) {
      startLockCountdown(until);
    }
    return () => {
      if (resendIv.current) clearInterval(resendIv.current);
      if (lockIv.current) clearInterval(lockIv.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startResendTimer = (secs = 45) => {
    setResendDisabled(true);
    setResendTimer(secs);
    if (resendIv.current) clearInterval(resendIv.current);
    resendIv.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(resendIv.current);
          resendIv.current = null;
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startLockCountdown = (until) => {
    if (lockIv.current) clearInterval(lockIv.current);
    const update = () => {
      const rem = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setLockRemaining(rem);
      if (rem <= 0) {
        clearInterval(lockIv.current);
        lockIv.current = null;
        localStorage.removeItem(lockKey);
        localStorage.setItem(attemptsKey, '0');
        setAttempts(0);
        setLockRemaining(0);
      }
    };
    update();
    lockIv.current = setInterval(update, 1000);
  };

  const send = async (phoneNumbers = []) => {
    try {
      // call the configured endpoint
      const response = await fetch(sendEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumbers }),
      });
      const result = await response.json();
      if (response.ok && result.otp) {
        setSentOtp(result.otp);
        // start resend cooldown
        startResendTimer(45);
        // reset attempts
        localStorage.setItem(attemptsKey, '0');
        setAttempts(0);
        return { ok: true, otp: result.otp };
      }
      return { ok: false, message: result?.message || 'Failed to send OTP' };
    } catch (err) {
      return { ok: false, message: 'Failed to connect to OTP server' };
    }
  };

  const resend = async (phoneNumbers = []) => {
    // do not resend while locked or in cooldown
    const lockUntil = parseInt(localStorage.getItem(lockKey) || '0', 10);
    if (lockUntil && lockUntil > Date.now()) return { ok: false, locked: true };
    if (resendDisabled) return { ok: false, cooldown: true };
    return await send(phoneNumbers);
  };

  const verify = async (code) => {
    // check lock
    const lockUntil = parseInt(localStorage.getItem(lockKey) || '0', 10);
    if (lockUntil && lockUntil > Date.now()) {
      const rem = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setLockRemaining(rem);
      return { ok: false, locked: true, remaining: rem };
    }
    if (!sentOtp) return { ok: false, message: 'No OTP sent' };
    if (String(code).trim() !== String(sentOtp).trim()) {
      const next = (parseInt(localStorage.getItem(attemptsKey) || '0', 10) || 0) + 1;
      localStorage.setItem(attemptsKey, String(next));
      setAttempts(next);
      if (next >= 3) {
        const until = Date.now() + 60 * 1000; // 60s lock
        localStorage.setItem(lockKey, String(until));
        startLockCountdown(until);
        return { ok: false, locked: true, remaining: 60 };
      }
      return { ok: false, message: 'Invalid OTP', attempts: next };
    }
    // success
    localStorage.setItem(attemptsKey, '0');
    localStorage.removeItem(lockKey);
    setAttempts(0);
    setLockRemaining(0);
    setSentOtp('');
    return { ok: true };
  };

  const reset = () => {
    setSentOtp('');
    setResendDisabled(false);
    setResendTimer(0);
    setLockRemaining(0);
    setAttempts(0);
    localStorage.removeItem(lockKey);
    localStorage.setItem(attemptsKey, '0');
    if (resendIv.current) { clearInterval(resendIv.current); resendIv.current = null; }
    if (lockIv.current) { clearInterval(lockIv.current); lockIv.current = null; }
  };

  return {
    send,
    resend,
    verify,
    reset,
    sentOtp,
    resendDisabled,
    resendTimer,
    lockRemaining,
    attempts,
  };
}
