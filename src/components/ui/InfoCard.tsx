import { useBranch } from "@/branch/BranchContext";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CONTACT_INFO } from "@/data/content";
import { hasConvex } from "@/providers/AppProviders";

const icons = {
  location: MapPin,
  phone: Phone,
  mail: Mail,
  hours: Clock,
};

interface InfoCardProps {
  type: keyof typeof icons;
  title: string;
  value: string;
  href?: string;
  index?: number;
  size?: "sm" | "md";
}

export function InfoCard({ type, title, value, href, index = 0, size = "md" }: InfoCardProps) {
  const Icon = icons[type];
  const isSm = size === "sm";
  const valueClass =
    type === "mail"
      ? "break-all"
      : "break-words";
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className={[
        "info-card min-w-0 rounded-xl border border-outline-variant/50 bg-white shadow-card",
        isSm ? "p-4" : "p-6",
      ].join(" ")}
    >
      <div
        className={[
          "mb-3 flex items-center justify-center rounded-lg bg-secondary-container/50",
          isSm ? "h-9 w-9" : "h-10 w-10",
        ].join(" ")}
      >
        <Icon className={isSm ? "h-[18px] w-[18px] text-primary-container" : "h-5 w-5 text-primary-container"} />
      </div>
      <p className="text-label-sm text-on-surface-variant mb-1">{title}</p>
      <p
        className={[
          "min-w-0",
          valueClass,
          isSm ? "text-body-md text-on-surface" : "text-body-lg text-on-surface",
        ].join(" ")}
      >
        {value}
      </p>
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="block rounded-xl outline-offset-4 transition-opacity hover:opacity-85">
        {content}
      </a>
    );
  }

  return content;
}

export function ContactInfoGrid({
  layout = "wide",
}: {
  layout?: "wide" | "compact";
}) {
  const { branches, branchId } = useBranch();
  const branch = branches.find((item) => item.id === branchId);
  const settings = useQuery(api.siteSettings.get, hasConvex() ? {} : "skip");
  const isCompact = layout === "compact";

  const location = branch?.address ?? settings?.location ?? CONTACT_INFO.location;
  const phone = settings?.phone ?? CONTACT_INFO.phone;
  const email = settings?.email ?? CONTACT_INFO.email;
  const hours = branch?.hours.join(" · ") || settings?.hours || CONTACT_INFO.hours;

  return (
    <div
      className={[
        "grid gap-4 sm:grid-cols-2",
        isCompact ? "" : "lg:grid-cols-4",
      ].join(" ")}
    >
      <InfoCard
        type="location"
        title="Location"
        value={location}
        index={0}
        size={isCompact ? "sm" : "md"}
      />
      <InfoCard
        type="phone"
        title="Phone Number"
        value={phone}
        href={`tel:${phone.replace(/\s/g, "")}`}
        index={1}
        size={isCompact ? "sm" : "md"}
      />
      <InfoCard
        type="mail"
        title="Mail"
        value={email}
        href={`mailto:${email}`}
        index={2}
        size={isCompact ? "sm" : "md"}
      />
      <InfoCard
        type="hours"
        title="Hours"
        value={hours}
        index={3}
        size={isCompact ? "sm" : "md"}
      />
    </div>
  );
}
