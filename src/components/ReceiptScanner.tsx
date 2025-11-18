import { useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Camera as CapacitorCamera } from "@capacitor/camera";
import { CameraResultType, CameraSource } from "@capacitor/camera";

interface ReceiptScannerProps {
  onScanComplete: (data: {
    amount?: string;
    category?: string;
    vendor?: string;
    description?: string;
  }) => void;
}

export const ReceiptScanner = ({ onScanComplete }: ReceiptScannerProps) => {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const captureReceipt = async (source: CameraSource) => {
    try {
      setProcessing(true);
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: source,
      });

      if (image.dataUrl) {
        setImagePreview(image.dataUrl);
        // In a real app, you would send this to an OCR/AI service
        // For now, we'll simulate processing
        await simulateReceiptProcessing(image.dataUrl);
      }
    } catch (error: any) {
      if (error.message !== "User cancelled photos app") {
        toast.error("Failed to capture receipt");
      }
    } finally {
      setProcessing(false);
    }
  };

  const simulateReceiptProcessing = async (imageData: string) => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, send imageData to AI service for OCR and categorization
    // For now, return sample data
    const extractedData = {
      amount: "45.99",
      vendor: "Sample Store",
      category: "Shopping",
      description: "Receipt scan"
    };

    onScanComplete(extractedData);
    toast.success("Receipt processed successfully!");
    setOpen(false);
    setImagePreview(null);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full border-primary/20 hover:border-primary/40 hover:bg-primary/5"
      >
        <Camera className="mr-2 h-4 w-4" />
        Scan Receipt
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Receipt</DialogTitle>
            <DialogDescription>
              Capture or upload a receipt to automatically extract expense details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Receipt preview"
                  className="w-full rounded-lg border border-border"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => setImagePreview(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => captureReceipt(CameraSource.Camera)}
                  disabled={processing}
                  className="h-32 flex-col gap-2"
                  variant="outline"
                >
                  <Camera className="h-8 w-8" />
                  <span>Take Photo</span>
                </Button>

                <Button
                  onClick={() => captureReceipt(CameraSource.Photos)}
                  disabled={processing}
                  className="h-32 flex-col gap-2"
                  variant="outline"
                >
                  <Upload className="h-8 w-8" />
                  <span>Upload Image</span>
                </Button>
              </div>
            )}

            {processing && (
              <div className="text-center py-4">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-2 text-sm text-muted-foreground">Processing receipt...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
