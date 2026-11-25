import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useBranch } from "@/branch/BranchContext";
import { hasConvex } from "@/providers/AppProviders";

export function Footer() {
  const { branches, branchId } = useBranch();
  const branch = branches.find(({ id }) => id === branchId) ?? branches[0];
  const settings = useQuery(api.siteSettings.get, hasConvex() ? {} : "skip");
  const socials = [
    { label: "Instagram", url: settings?.instagramUrl },
    { label: "Facebook", url: settings?.facebookUrl },
    { label: "X", url: settings?.xUrl },
  ].filter(({ url }) => url && /^https:\/\/[^/]+\/.+/.test(url));

  return (
    <footer className="eman-footer">
      <motion.div className="eman-footer-grid" initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.55 }}>
        <div className="eman-footer-photo"><img src="/Images/eman-table.webp" alt="" loading="lazy" decoding="async" /></div>
        <div>
          <h2>See you over coffee.</h2>
          {branch && <><p className="mt-5 font-semibold">{branch.label}</p><p className="mt-2">{branch.address}</p>
            <ul className="mt-2">{branch.hours.map((hour) => <li key={hour}>{hour}</li>)}</ul></>}
          <Link className="eman-reserve mt-6" to="/reservation">Reserve a table <ArrowUpRight size={15} aria-hidden /></Link>
        </div>
        <nav aria-label="Footer navigation" className="eman-footer-links">
          <Link to="/about">Our story</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/#locations">Locations</Link>
          <Link to="/contact">Contact</Link>
          {socials.map(({ url, label }) => <a key={label} href={url} target="_blank" rel="noreferrer">{label} ↗</a>)}
        </nav>
      </motion.div>
      <Link to="/" className="eman-footer-mark" aria-label="Kafe Eman home">Kafe Eman</Link>
      <div className="eman-footer-legal"><p>© {new Date().getFullYear()} Kafe Eman</p><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
    </footer>
  );
}
