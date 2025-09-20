import { cn } from "@kaa/ui/lib/utils";
import { Loader2 } from "lucide-react";
import useMounted from "@/hooks/use-mounted";

const Spinner = ({ className = "", noDelay = false }) => {
  const { hasStarted } = useMounted();

  return (
    <div
      className="group transition-all duration-300 data-[started=false]:data-[delay=false]:opacity-0"
      data-delay={noDelay}
      data-started={hasStarted}
    >
      <Loader2
        className={cn(
          "mx-auto h-6 w-6 animate-spin text-muted-foreground",
          className
        )}
      />
    </div>
  );
};

export default Spinner;
