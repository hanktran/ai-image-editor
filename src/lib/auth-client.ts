import { createAuthClient } from "better-auth/react";
import { env } from "~/env";
import { polarClient } from "@polar-sh/better-auth/client";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [polarClient()],
});
