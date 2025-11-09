import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText } from "lucide-react";

const DataExport = () => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  const exportData = async (format: 'csv' | 'json') => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-expenses`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format,
            startDate: startDate || null,
            endDate: endDate || null,
          }),
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Expenses exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Download className="h-6 w-6 md:h-8 md:w-8" />
          Export Data
        </h1>
        <p className="text-muted-foreground mt-1">Download your expense data</p>
      </div>

      <Card className="p-4 md:p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Date Range (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Export Format</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => exportData('csv')}
                disabled={loading}
                className="h-24 flex-col gap-2"
                variant="outline"
              >
                <FileText className="h-8 w-8" />
                <span>Export as CSV</span>
              </Button>
              <Button
                onClick={() => exportData('json')}
                disabled={loading}
                className="h-24 flex-col gap-2"
                variant="outline"
              >
                <FileText className="h-8 w-8" />
                <span>Export as JSON</span>
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>CSV Format:</strong> Ideal for Excel, Google Sheets, and data analysis</p>
            <p><strong>JSON Format:</strong> Ideal for developers and data import</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DataExport;
