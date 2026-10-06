import Constants from 'expo-constants';
import { z } from 'zod';

const appEnvSchema = z.enum(['development', 'staging', 'production']);

const envSchema = z.object({
  appEnv: appEnvSchema,
  apiBaseUrl: z.string().url(),
});

export type AppEnv = z.infer<typeof appEnvSchema>;
export type Env = z.infer<typeof envSchema>;

function loadRawEnv(): unknown {
  const extra = Constants.expoConfig?.extra as
    | { appEnv?: string; apiBaseUrl?: string }
    | undefined;

  return {
    appEnv: extra?.appEnv ?? process.env.APP_ENV,
    apiBaseUrl: extra?.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL,
  };
}

const parsed = envSchema.safeParse(loadRawEnv());

if (!parsed.success) {
  const detail = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(
    `Invalid environment configuration. Set APP_ENV (development|staging|production) and EXPO_PUBLIC_API_BASE_URL. ${detail}`,
  );
}

export const env: Env = parsed.data;
