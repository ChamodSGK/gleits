import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import { useReveal } from "./components/shared.jsx";
import Cursor from "./effects/Cursor.jsx";
import ScrollHud from "./effects/ScrollHud.jsx";
import { useScramble } from "./effects/scramble.js";
import { useParallax } from "./effects/useParallax.js";
import { scrollToTarget, startSmoothScroll, stopSmoothScroll } from "./effects/smoothScroll.js";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Services from "./pages/Services.jsx";
import ServiceDetail from "./pages/ServiceDetail.jsx";
import Industries from "./pages/Industries.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Technologies from "./pages/Technologies.jsx";
import Careers from "./pages/Careers.jsx";
import Contact from "./pages/Contact.jsx";
import { Privacy, Terms } from "./pages/Legal.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  const { pathname, hash } = useLocation();

  // Inertial smooth scrolling for the whole site (must start before the effect below)
  useEffect(() => {
    startSmoothScroll();
    return stopSmoothScroll;
  }, []);

  // New page: jump to top (or glide to the #anchor if there is one)
  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    scrollToTarget(target);
  }, [pathname, hash]);

  useReveal(pathname);
  useScramble(pathname);
  useParallax(pathname);

  return (
    <>
      <Cursor />
      <ScrollHud />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/technologies" element={<Technologies />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/terms-and-conditions" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
