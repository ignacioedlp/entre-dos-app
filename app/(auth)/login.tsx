import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Logo } from "../../components/ui/Logo";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { login } = useAuth();
  const { t } = useTranslation("auth");

  const schema = z.object({
    email: z.string().email(t("login.errorEmail")),
    password: z.string().min(1, t("login.errorPassword")),
  });
  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setApiError(null);
      const profile = await login(data.email, data.password);
      router.replace(profile.coupleId ? "/(app)/" : "/(auth)/link");
    } catch {
      setApiError(t("login.errorInvalid"));
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <View style={styles.header}>
        <Logo size="lg" />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t("login.title")}</Text>
        <Text style={styles.subtitle}>{t("login.subtitle")}</Text>

        <Text style={styles.label}>{t("login.email")}</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder={t("login.emailPlaceholder")}
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email.message}</Text>
        )}

        <Text style={[styles.label, styles.labelPassword]}>{t("login.password")}</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.password && styles.inputError,
                ]}
                placeholder={t("login.passwordPlaceholder")}
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
                hitSlop={8}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>
          )}
        />
        {errors.password && (
          <Text style={styles.errorText}>{errors.password.message}</Text>
        )}

        <Pressable style={styles.forgotLink}>
          <Text style={styles.forgotText}>{t("login.forgotPassword")}</Text>
        </Pressable>

        {apiError && <Text style={styles.errorText}>{apiError}</Text>}
      </View>

      <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          label={isSubmitting ? t("login.submitting") : t("login.submit")}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t("login.or")}</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.googleButton,
            pressed && styles.googleButtonPressed,
          ]}
        >
          <AntDesign name="google" size={18} color="currentColor" />
          <Text style={styles.googleLabel}>{t("login.google")}</Text>
        </Pressable>

        <Pressable
          style={styles.registerLink}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.registerLinkText}>
            {t("login.noAccount")}
            <Text style={styles.registerLinkAccent}>{t("login.registerLink")}</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 48,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_900Black",
    fontSize: 40,
    lineHeight: 40,
    textTransform: "uppercase",
    letterSpacing: -1.5,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  labelPassword: {
    marginTop: 24,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderColor: "#EDF1F3",
  },
  inputError: {
    borderColor: Colors.pasion,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    position: "absolute",
    right: 4,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: 12,
  },
  forgotText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: "underline",
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.pasion,
    marginTop: 8,
  },
  ctaArea: {
    paddingTop: 16,
    gap: 10,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 9999,
    paddingVertical: 16,
  },
  googleButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  googleLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: 0.3,
    color: "#1a1a1a",
  },
  registerLink: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  registerLinkText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerLinkAccent: {
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
    textDecorationLine: "underline",
  },
});
