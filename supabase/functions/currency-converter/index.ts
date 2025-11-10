import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { from, to, amount } = await req.json();
    
    console.log(`Converting ${amount} from ${from} to ${to}`);

    // Check cache first
    const { data: cachedRate } = await supabase
      .from('exchange_rates')
      .select('rate, updated_at')
      .eq('base_currency', from)
      .eq('target_currency', to)
      .single();

    let rate: number;
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

    if (cachedRate && (Date.now() - new Date(cachedRate.updated_at).getTime()) < cacheExpiry) {
      rate = Number(cachedRate.rate);
      console.log(`Using cached rate: ${rate}`);
    } else {
      // Fetch from external API (using exchangerate-api.com free tier)
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      rate = data.rates[to];

      if (!rate) {
        throw new Error(`Exchange rate not found for ${from} to ${to}`);
      }

      // Update cache
      await supabase
        .from('exchange_rates')
        .upsert({
          base_currency: from,
          target_currency: to,
          rate: rate,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'base_currency,target_currency'
        });

      console.log(`Fetched and cached new rate: ${rate}`);
    }

    const convertedAmount = amount * rate;

    return new Response(
      JSON.stringify({ 
        from,
        to,
        rate,
        originalAmount: amount,
        convertedAmount,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Currency conversion error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});