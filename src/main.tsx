import { MotionConfig } from "framer-motion";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppSplashGate } from "@/components/splash/AppSplashGate";
import { AppProviders } from "@/providers/AppProviders";
import "./index.css";

function Root() {
  return (
    <AppProviders>
      <AppSplashGate>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppSplashGate>
    </AppProviders>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <Root />
    </MotionConfig>
  </StrictMode>,
);
