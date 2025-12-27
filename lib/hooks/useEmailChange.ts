"use client";

import { useState } from "react";
import { createClient } from "@/lib/db/supabase/client";
import { getErrorTranslationKey } from "@/lib/utils/errorHandler";

interface UseEmailChangeReturn {
  newEmail: string;
  setNewEmail: (email: string) => void;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  showVerificationCode: boolean;
  setShowVerificationCode: (show: boolean) => void;
  loading: boolean;
  error: string | null;
  success: boolean;
  sendVerificationCode: (currentEmail: string) => Promise<void>;
  verifyEmailChange: (onSuccess: (newEmail: string) => void) => Promise<void>;
}

/**
 * Хук для управления изменением email пользователя
 */
export function useEmailChange(): UseEmailChangeReturn {
  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendVerificationCode = async (currentEmail: string) => {
    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      setError("errors.invalidEmail");
      return;
    }

    if (newEmail === currentEmail) {
      setError("errors.sameEmail");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    // Вызываем updateUser с новым email - это отправит код подтверждения на новый email
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (updateError) {
      setError(getErrorTranslationKey(updateError));
      setLoading(false);
    } else {
      setShowVerificationCode(true);
      setLoading(false);
    }
  };

  const verifyEmailChange = async (onSuccess: (newEmail: string) => void) => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("errors.invalidCode");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    // Подтверждаем код через verifyOtp
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: newEmail,
      token: verificationCode,
      type: "email_change",
    });

    if (verifyError) {
      setError(getErrorTranslationKey(verifyError));
      setLoading(false);
    } else {
      // Email успешно изменён, перезагружаем данные пользователя
      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser();

      if (updatedUser) {
        setSuccess(true);
        const finalEmail = updatedUser.email || newEmail;
        onSuccess(finalEmail);
        setNewEmail("");
        setVerificationCode("");
        setShowVerificationCode(false);
        setTimeout(() => setSuccess(false), 3000);
      }
      setLoading(false);
    }
  };

  return {
    newEmail,
    setNewEmail,
    verificationCode,
    setVerificationCode,
    showVerificationCode,
    setShowVerificationCode,
    loading,
    error,
    success,
    sendVerificationCode,
    verifyEmailChange,
  };
}
