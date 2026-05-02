import { useState } from "react";
import { Camera, Upload, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { extractReceiptData, runOcr, type ParsedReceipt } from "@/lib/receiptOcr";

interface ReceiptScannerProps {
  onScanComplete: (data: {
    amount?: string;
    category?: string;
    vendor?: string;
    description?: string;
    date?: string;
  }) => void;
  triggerless?: boolean;
  defaultOpen?: boolean;
  onClose?: () => void;
}

export const ReceiptScanner = ({
  onScanComplete,
  triggerless = false,
  defaultOpen = false,
  onClose,
}: ReceiptScannerProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setImagePreview(null);
      setParsed(null);
      setProgress(0);
      onClose?.();
    }
  };

  const captureReceipt = async (source: CameraSource) => {
    try {
      setProcessing(true);
      setProgress(0);
      const image = await CapacitorCamera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
      });

      if (!image.dataUrl) return;
      setImagePreview(image.dataUrl);

      const text = await runOcr(image.dataUrl, (p) => setProgress(Math.round(p * 100)));
      const data = extractReceiptData(text);
      setParsed(data);

      if (!data.amount) {
        toast.warning("Couldn't detect an amount — please enter it manually");
      } else {
        toast.success("Receipt scanned!");
      }
    } catch (error: any) {
      const msg = String(error?.message || error);
      if (!msg.toLowerCase().includes("cancel")) {
        toast.error("Failed to scan receipt");
        console.error(error);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (!parsed) return;
    onScanComplete({
      amount: parsed.amount,
      vendor: parsed.merchant,
      date: parsed.date,
      description: parsed.merchant ? `Receipt - ${parsed.merchant}` : "Scanned receipt",
    });
    handleOpenChange(false);
  };

  const updateField = (field: keyof ParsedReceipt, value: string) => {
    setParsed((p) => ({ ...(p || {}), [field]: value }));
  };

  return (
    <>
      {!triggerless && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full border-primary/20 hover:border-primary/40 hover:bg-primary/5"
        >
          <Camera className="mr-2 h-4 w-4" />
          Scan Receipt
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scan Receipt</DialogTitle>
            <DialogDescription>
              Capture a receipt to auto-extract amount, merchant, and date
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!imagePreview && !processing && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => captureReceipt(CameraSource.Camera)}
                  className="h-28 flex-col gap-2"
                  variant="outline"
                >
                  <Camera className="h-7 w-7" />
                  <span className="text-xs font-medium">Take Photo</span>
                </Button>
                <Button
                  onClick={() => captureReceipt(CameraSource.Photos)}
                  className="h-28 flex-col gap-2"
                  variant="outline"
                >
                  <Upload className="h-7 w-7" />
                  <span className="text-xs font-medium">Upload Image</span>
                </Button>
              </div>
            )}

            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Receipt"
                  className="w-full max-h-48 object-contain rounded-lg border border-border bg-muted"
                />
                {!processing && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => {
                      setImagePreview(null);
                      setParsed(null);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}

            {processing && (
              <div className="text-center py-3 space-y-2">
                <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  Reading receipt… {progress}%
                </p>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {parsed && !processing && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={parsed.amount || ""}
                    onChange={(e) => updateField("amount", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Merchant</Label>
                  <Input
                    value={parsed.merchant || ""}
                    onChange={(e) => updateField("merchant", e.target.value)}
                    placeholder="Store name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={parsed.date || ""}
                    onChange={(e) => updateField("date", e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleConfirm}
                  disabled={!parsed.amount}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Use this data
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
