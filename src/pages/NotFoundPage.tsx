import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <section className="container-main flex min-h-[60vh] flex-col items-center justify-center py-32 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-label-sm text-primary-container mb-4">404</p>
        <h1 className="text-display-lg text-on-surface mb-4">Page Not Found</h1>
        <p className="text-body-lg text-on-surface-variant mb-8 max-w-md">
          The page you're looking for doesn't exist. Let's get you back to the café.
        </p>
        <Button to="/">Return Home</Button>
      </motion.div>
    </section>
  );
}
