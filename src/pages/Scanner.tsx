import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { useState } from "react";

const Scanner = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleScanComplete = (data: any) => {
    const params = new URLSearchParams();
    if (data.amount) params.set("amount", data.amount);
    if (data.vendor) params.set("vendor", data.vendor);
    if (data.date) params.set("date", data.date);
    if (data.description) params.set("description", data.description);
    navigate(`/add-expense?${params.toString()}`);
  };

  return (
    <div className="animate-fade-in min-h-[60vh] flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-bold">Receipt Scanner</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-4">
          <h2 className="text-lg font-semibold">Scan a receipt</h2>
          <p className="text-sm text-muted-foreground">
            We'll automatically read the amount, merchant, and date so you can save it as a transaction.
          </p>
          <ReceiptScanner
            triggerless
            defaultOpen={open}
            onClose={() => setOpen(false)}
            onScanComplete={handleScanComplete}
          />
          {!open && (
            <Button onClick={() => setOpen(true)} className="w-full">
              Open Scanner
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scanner;
