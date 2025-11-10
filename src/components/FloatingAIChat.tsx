import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const FloatingAIChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnAIPage = location.pathname === "/ai-assistant";

  const handleClick = () => {
    if (isOnAIPage) {
      navigate(-1); // Go back to previous page
    } else {
      navigate("/ai-assistant");
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      <Button
        onClick={handleClick}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110",
          "bg-gradient-to-br from-primary via-accent to-primary",
          isOnAIPage ? "" : "animate-pulse",
          "hover:shadow-primary/50"
        )}
      >
        {isOnAIPage ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive animate-bounce" />
    </div>
  );
};
