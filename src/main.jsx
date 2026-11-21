import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

// Always start a fresh load at the top (the intro and pinned story assume it)
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

// The logo intro plays when the site is opened on the Home page (not for reduced motion).
// The class is set before the first render so the hero entrance waits for the intro.
const playIntro = window.location.pathname === "/" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (playIntro) document.documentElement.classList.add("intro-active");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App playIntro={playIntro} />
    </BrowserRouter>
  </StrictMode>,
);
