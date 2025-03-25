
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find the page you're looking for. The page might have been removed or the link might be broken.
        </p>
        <Button asChild size="lg">
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
