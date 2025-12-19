import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pennora.app",
  appName: "Pennora",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    // TODO: Настроить плагины Capacitor при необходимости
  },
};

export default config;
