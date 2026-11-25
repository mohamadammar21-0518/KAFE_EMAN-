import { useNavigate } from "react-router-dom";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { MenuCard } from "@/components/ui/MenuCard";
import { useBranchCurrency } from "@/branch/useBranchCurrency";
import type { MenuItem } from "@/data/content";

interface StickyMenuStackProps {
  items: MenuItem[];
}

/** Signature menu — static grid with gentle scroll-in; no scroll-hijack or 3D motion. */
export function StickyMenuStack({ items }: StickyMenuStackProps) {
  const navigate = useNavigate();
  const branchCurrency = useBranchCurrency();
  const displayItems = items.slice(0, 4);

  return (
    <section id="signature-menu" className="bg-warm py-14 sm:py-20">
      <div className="container-main flex flex-col gap-8 sm:gap-10">
        <SectionTitle
          eyebrow="Signature Menu"
          title="Handpicked selections loved by our guests"
          align="center"
          titleColor="green"
          className="mx-auto"
        />

        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
          {displayItems.map((item, index) => (
            <MenuCard
              key={item._id}
              variant="stack"
              name={item.name}
              price={item.price}
              currency={branchCurrency}
              imageUrl={item.imageUrl}
              category={item.category}
              index={index}
              priority
              onOpen={() => navigate("/menu")}
            />
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <Button to="/menu">Explore Our Menu</Button>
        </div>
      </div>
    </section>
  );
}
