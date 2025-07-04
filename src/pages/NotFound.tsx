
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import BrandTypography from "@/components/branding/BrandTypography";
import EmptyState from "@/components/branding/EmptyState";
import { COPY } from "@/components/copy/StandardizedCopy";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-[var(--page-padding-x)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <EmptyState
            icon={FileQuestion}
            title="Page Not Found"
            description={COPY.EMPTY_STATES.NO_RESULTS + ". The page might have been removed or the link might be broken."}
            action={{
              label: "Return to Dashboard",
              onClick: () => {},
              variant: "default"
            }}
            className="border-dashed-0 bg-gradient-subtle"
          />
          
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default NotFound;
