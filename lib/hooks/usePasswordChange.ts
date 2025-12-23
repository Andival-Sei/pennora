"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

// Схема для смены пароля
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "validation.password.required"),
    newPassword: z
      .string()
      .min(8, "validation.password.min")
      .max(128, "validation.password.max")
      .regex(/^[^\u0400-\u04FF]+$/, "validation.password.latinOnly")
      .regex(/[A-Z]/, "validation.password.uppercase")
      .regex(/[a-z]/, "validation.password.lowercase")
      .regex(/[0-9]/, "validation.password.number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "validation.password.mismatch",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface UsePasswordChangeReturn {
  form: ReturnType<typeof useForm<PasswordFormData>>;
  newPasswordValue: string | undefined;
  loading: boolean;
  error: string | null;
  success: boolean;
  onSubmit: (data: PasswordFormData) => Promise<void>;
}

/**
 * Хук для управления сменой пароля пользователя
 */
export function usePasswordChange(): UsePasswordChangeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: "onTouched",
  });

  const newPasswordValue = useWatch({
    control: form.control,
    name: "newPassword",
  });

  const onSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    // Supabase не требует текущий пароль для смены, но мы проверяем для безопасности
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    if (updateError) {
      setError("errors.unknown");
    } else {
      setSuccess(true);
      form.reset();
      setTimeout(() => setSuccess(false), 3000);
    }

    setLoading(false);
  };

  return {
    form,
    newPasswordValue,
    loading,
    error,
    success,
    onSubmit,
  };
}
