import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { takeLoginError } from "./returnTo";
import { SessionProvider } from "./session";
import "./styles.css";

// A failed GitHub sign-in lands on "/?login_error=<code>". Read it once and
// clean the address bar so a reload does not show the error again.
const loginError = takeLoginError(window.location, (url) =>
  window.history.replaceState(null, "", url),
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <SessionProvider>
        <App loginError={loginError} />
      </SessionProvider>
    </HashRouter>
  </StrictMode>,
);
