import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { formatPrice, MENU_CATEGORIES } from "@/data/content";
import { useBranch } from "@/branch/BranchContext";
import { useBranchCurrency } from "@/branch/useBranchCurrency";
import { useFaqs, useMenuItems } from "@/hooks/useData";
import { HeroSection } from "@/components/sections/HeroSection";
import { BranchLocations } from "@/components/sections/BranchLocations";
import { FaqAccordion } from "@/components/ui/FaqAccordion";

function CounterMenu() {
  const { branchId, branches, openBranchPicker } = useBranch();
  const items = useMenuItems({ branchId });
  const currency = useBranchCurrency();
  const categories = MENU_CATEGORIES.filter((category) => items.some((item) => item.category === category.id));
  const [selection, setSelection] = useState("");
  const selected = categories.find((category) => category.id === selection) ?? categories[0];
  const [previewId, setPreviewId] = useState<string>();
  const list = items.filter((item) => item.category === selected?.id).slice(0, 4);
  const preview = list.find((item) => item._id === previewId) ?? list[0];
  return (
    <section id="signature-menu" className="eman-spread eman-menu">
      <div className="eman-menu-art">
        <motion.img key={preview?.imageUrl ?? "pastries"} src={preview?.imageUrl || "/Images/eman-pastries.webp"}
          loading="lazy" alt={preview?.name ?? "Pastries at the café"}
          initial={{ opacity: 0.4, scale: 1.025 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }} />
        <div className="eman-menu-photo-caption"><span>{preview?.name ?? "At the counter"}</span><Link to="/menu">Discover the menu ↗</Link></div>
      </div>
      <div>
        <h2>From the counter</h2>
        <button className="eman-link" onClick={openBranchPicker}>{branches.find((b) => b.id === branchId)?.label} · Change branch</button>
        <div className="eman-filters" aria-label="Menu categories">
          {categories.map((c) => <button type="button" key={c.id} aria-pressed={c.id === selected?.id} onClick={() => setSelection(c.id)}>{c.label}</button>)}
        </div>
        <motion.ul key={selected?.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {list.map((item) => <li key={item._id} onMouseEnter={() => setPreviewId(item._id)}>
              <Link to="/menu" onFocus={() => setPreviewId(item._id)}>
                <div><h3>{item.name}</h3><span>{formatPrice(item.price, currency)}</span></div>
                <p>{item.description}</p>
              </Link>
            </li>)}
        </motion.ul>
        <Link className="eman-link" to="/menu">Full menu ↗</Link>
      </div>
    </section>
  );
}

export function HomePage() {
  const faqs = useFaqs();
  const reduced = useReducedMotion();
  return (
    <div className="eman-home">
      <HeroSection />
      <section id="about" className="eman-introduction">
        <p className="eman-caption">Kafe Eman · Kedah</p>
        <motion.h2 initial={{ opacity: 0, y: reduced ? 0 : 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.7 }}>
          A good cup starts a conversation.<br />
          A familiar table brings us together.<br />
          Take a little time at Eman.
        </motion.h2>
        <Link to="/about" className="eman-link">Meet Kafe Eman ↗</Link>
      </section>
      <section className="eman-culture" aria-labelledby="culture-heading">
        <p className="eman-caption">The Eman experience</p>
        <h2 id="culture-heading">Come for coffee.<br />Make time to stay.</h2>
        <div className="eman-culture-layout">
          <motion.img src="/Images/eman-espresso.webp" loading="lazy" alt="Espresso pouring into a glass"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} />
          <div>
            {[
              ["At the counter", "Start with a cup.", "Browse the menu for your branch, discover a favourite, and take a moment over coffee."],
              ["In Alor Setar", "Coffee meets the barber.", "Our Taman Koperasi branch brings a café and barbershop together under one roof."],
              ["Around Kedah", "Find your Eman.", "Visit Alor Setar, Kepala Batas, or UUM Sintok. Each branch has its own hours and menu."],
            ].map(([label, title, description]) => (
              <motion.article key={label} initial={{ opacity: 0, y: reduced ? 0 : 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.55 }}>
                <p>{label}</p><div><h3>{title}</h3><p>{description}</p></div>
              </motion.article>
            ))}
          </div>
          <motion.img src="/Images/eman-pastries.webp" loading="lazy" alt="Pastries in the café film"
            initial={{ opacity: 0, y: reduced ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.75 }} />
        </div>
      </section>
      <section id="ambience" className="eman-invitation">
        <motion.img src="/Images/eman-table.webp" loading="lazy" alt="" initial={{ scale: reduced ? 1 : 1.07 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.3 }}/>
        <motion.div initial={{ opacity: 0, y: reduced ? 0 : 18 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.65 }}>
          <h2>Stay for<br /><em>another cup.</em></h2>
          <Link to="/reservation" className="eman-link">Reserve a table ↗</Link>
        </motion.div>
      </section>
      <section className="eman-spread eman-feature">
        <div>
          <p className="eman-caption">Coffee &amp; company</p>
          <h2>A little pause.<br />A longer<br />conversation.</h2>
          <div className="eman-feature-notes">
            <article><h3>Make it your usual</h3><p>Explore the drinks and food at your selected branch, then settle on something you love.</p></article>
            <article><h3>Make a day of it</h3><p>At Alor Setar, the café and barbershop share a home. Head over for a coffee, a haircut, or both.</p></article>
          </div>
          <Link to="/menu" className="eman-link">Explore the menu ↗</Link>
        </div>
        <motion.img src="/Images/eman-table.webp" loading="lazy" alt="Coffee and a croissant by the window"
          initial={{ opacity: 0, y: reduced ? 0 : 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }} />
      </section>
      <ScrollPortrait />
      <MenuIntroduction />
      <CounterMenu />
      <section className="eman-spread eman-philosophy">
        <img src="/Images/eman-espresso.webp" loading="lazy" alt="Espresso at the coffee counter" />
        <div><p className="eman-caption">Our philosophy</p><h2>Good company<br />starts here.</h2>
          <div className="eman-philosophy-notes">
            <article><h3>A space to meet</h3><p>A table for your catch-up, a moment to yourself, or a break between the day’s plans.</p></article>
            <article><h3>A local connection</h3><p>Find us in Alor Setar, Kepala Batas, and UUM Sintok. Check your branch for its menu and opening hours.</p></article>
          </div>
          <Link to="/reservation" className="eman-link">Plan your visit ↗</Link>
        </div>
      </section>
      <ContactInvitation />
      <BranchLocations />
      <section id="faq" className="eman-spread eman-faq"><h2>Before you visit</h2><FaqAccordion items={faqs} /></section>
    </div>
  );
}


function ScrollPortrait() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const clipPath = useTransform(scrollYProgress, [0, 0.85], [
    "inset(12% 35% 12% 35%)", "inset(0% 0% 0% 0%)",
  ]);
  return (
    <section ref={ref} className="eman-scroll-portrait" aria-label="A moment by the window">
      <motion.div style={{ clipPath: reduced ? "inset(0)" : clipPath }}>
        <img src="/Images/eman-table.webp" alt="Coffee and a croissant on a sunlit café table" loading="lazy" />
        <p>A moment<br />to call your own.</p>
      </motion.div>
    </section>
  );
}

function MenuIntroduction() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);
  return (
    <section ref={ref} className="eman-menu-intro" aria-labelledby="menu-intro-heading">
      <motion.h2 id="menu-intro-heading" style={{ x: reduced ? 0 : x }}>At the counter</motion.h2>
      <div><p>Find your next favourite.<br />A drink for the moment,<br />a reason to come back.</p>
        <Link to="/menu" className="eman-link">Browse the full menu ↗</Link></div>
    </section>
  );
}

function ContactInvitation() {
  const { branches, branchId } = useBranch();
  const branch = branches.find((item) => item.id === branchId);
  return (
    <section className="eman-contact-scene" aria-labelledby="visit-heading">
      <img src="/Images/eman-table.webp" alt="" loading="lazy" />
      <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
        <p className="eman-caption">Your next visit</p>
        <h2 id="visit-heading">Your table<br />is waiting.</h2>
        {branch && <div className="eman-contact-details"><p>{branch.label}</p>
          <ul>{branch.hours.map((hour) => <li key={hour}>{hour}</li>)}</ul></div>}
        <Link to="/reservation" className="eman-link">Reserve a table ↗</Link>
        <Link to="/#locations" className="eman-link">Find a branch ↗</Link>
      </motion.div>
    </section>
  );
}
