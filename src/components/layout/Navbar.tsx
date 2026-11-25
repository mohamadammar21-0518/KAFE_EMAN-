import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, MapPin, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useBranch } from "@/branch/BranchContext";
import { NavbarAccountButton } from "./NavbarAccountButton";

const links = [
  { to: "/about", label: "Our story" },
  { to: "/#ambience", label: "Experience" },
  { to: "/menu", label: "Menu" },
  { to: "/#locations", label: "Locations" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const location = useLocation();
  const { branches, branchId, openBranchPicker } = useBranch();
  const selectedBranch = branches.find(({ id }) => id === branchId);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => window.scrollY > 60);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 60);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => setOpen(false), [location.key]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [open]);

  function chooseBranch() {
    setOpen(false);
    openBranchPicker();
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="eman-header"
      data-solid={scrolled || open || location.pathname !== "/"}
    >
      <nav className="eman-nav" aria-label="Main navigation">
        <Link className="eman-nav-brand" to="/">Welcome to Kafe Eman</Link>
        <div className="eman-nav-links">
          {links.map(({ to, label }) => <Link key={to} to={to}>{label}</Link>)}
        </div>
        <div className="eman-nav-actions">
          <button type="button" className="eman-nav-location" onClick={chooseBranch}>
            <MapPin size={15} aria-hidden /> {selectedBranch?.label ?? "Choose branch"}
          </button>
          <NavbarAccountButton />
          <Link to="/reservation" className="eman-reserve">Reserve <ArrowUpRight size={14} aria-hidden /></Link>
        </div>
        <button ref={toggle} type="button" className="eman-nav-toggle" onClick={() => setOpen(!open)}
          aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div className="eman-drawer" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.23 }}>
            {links.map(({ to, label }) => <Link key={to} to={to} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={17} aria-hidden /></Link>)}
            <button type="button" onClick={chooseBranch}><MapPin size={16} aria-hidden /> {selectedBranch?.label ?? "Choose branch"}</button>
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <NavbarAccountButton onNavigate={() => setOpen(false)} />
              <Link to="/reservation" className="eman-reserve" onClick={() => setOpen(false)}>Reserve a table</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
