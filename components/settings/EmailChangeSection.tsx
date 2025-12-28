"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEmailChange } from "@/lib/hooks/useEmailChange";

interface EmailChangeSectionProps {
  currentEmail: string;
  onEmailUpdated: (newEmail: string) => void;
}

/**
 * Компонент секции изменения email пользователя
 */
export function EmailChangeSection({
  currentEmail,
  onEmailUpdated,
}: EmailChangeSectionProps) {
  const t = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations();
  const tCommon = useTranslations("common");

  const {
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
  } = useEmailChange();

  const handleSendCode = () => {
    sendVerificationCode(currentEmail);
  };

  const handleVerify = () => {
    verifyEmailChange(onEmailUpdated);
  };

  return (
    <FadeIn delay={0.15}>
      <Card>
        <CardHeader>
          <CardTitle>{t("emailChange.title")}</CardTitle>
          <CardDescription>{t("emailChange.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                >
                  {tErrors(error)}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {t("emailChange.success")}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="newEmail">{t("emailChange.newEmail")}</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setShowVerificationCode(false);
                  setVerificationCode("");
                }}
                placeholder={tAuth("email")}
                disabled={loading || showVerificationCode}
                aria-invalid={!!error}
              />
            </div>

            <AnimatePresence>
              {showVerificationCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">
                      {t("emailChange.code")}
                    </Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setVerificationCode(value);
                      }}
                      placeholder="000000"
                      disabled={loading}
                      className="text-center text-lg tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("emailChange.codeHint")}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleVerify}
                      disabled={loading || verificationCode.length !== 6}
                      className="flex-1"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {t("emailChange.confirm")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowVerificationCode(false);
                        setVerificationCode("");
                      }}
                      disabled={loading}
                    >
                      {tCommon("cancel")}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showVerificationCode && (
              <Button
                type="button"
                onClick={handleSendCode}
                disabled={loading || !newEmail || newEmail === currentEmail}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t("emailChange.sendCode")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
