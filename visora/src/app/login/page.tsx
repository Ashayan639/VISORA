import { getEnabledAuthProviderIds, isAuthConfigured } from "@/lib/auth";

import { LoginView } from "./login-view";

export default function LoginPage() {
  return (
    <LoginView
      authConfigured={isAuthConfigured()}
      enabledProviders={getEnabledAuthProviderIds()}
    />
  );
}
