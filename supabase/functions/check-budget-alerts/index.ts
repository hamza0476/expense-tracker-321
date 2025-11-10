import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  user_id: string;
  subscription: string;
  device_token?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, category } = await req.json();
    
    console.log(`Checking budget alerts for user ${userId}, category: ${category || 'all'}`);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Fetch user's budget alerts
    const { data: alerts } = await supabase
      .from('budget_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true);

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active alerts found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notifications = [];

    for (const alert of alerts) {
      // Skip if category specified and doesn't match
      if (category && alert.category !== category) continue;

      // Get budget for this category
      const { data: budget } = await supabase
        .from('budgets')
        .select('amount')
        .eq('user_id', userId)
        .eq('category', alert.category)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single();

      if (!budget) continue;

      // Calculate total spending for this category this month
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', userId)
        .eq('category', alert.category)
        .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
        .lt('date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);

      const totalSpent = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const budgetAmount = Number(budget.amount);
      const percentage = (totalSpent / budgetAmount) * 100;
      const threshold = alert.threshold_percentage;

      console.log(`Category ${alert.category}: ${percentage.toFixed(1)}% of budget used (threshold: ${threshold}%)`);

      // Check if we should send notification
      if (percentage >= threshold) {
        const shouldNotify = !alert.last_triggered_at || 
          (Date.now() - new Date(alert.last_triggered_at).getTime()) > 24 * 60 * 60 * 1000; // 24 hours

        if (shouldNotify) {
          let title = '';
          let body = '';

          if (percentage >= 100) {
            title = `💸 Budget Exceeded!`;
            body = `You've exceeded your ${alert.category} budget by $${(totalSpent - budgetAmount).toFixed(2)}`;
          } else if (percentage >= 90) {
            title = `⚠️ Budget Warning`;
            body = `You've used ${percentage.toFixed(0)}% of your ${alert.category} budget`;
          } else {
            title = `📊 Budget Alert`;
            body = `You've reached ${percentage.toFixed(0)}% of your ${alert.category} budget`;
          }

          notifications.push({
            alertId: alert.id,
            category: alert.category,
            title,
            body,
            percentage: percentage.toFixed(1),
            spent: totalSpent.toFixed(2),
            budget: budgetAmount.toFixed(2)
          });

          // Update last triggered time
          await supabase
            .from('budget_alerts')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', alert.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        notifications,
        count: notifications.length,
        message: notifications.length > 0 
          ? `${notifications.length} notification(s) triggered` 
          : 'No notifications needed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Budget alert check error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});