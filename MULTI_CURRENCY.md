# 💱 Multi-Currency Support Guide

ExpenseWiz now supports multiple currencies with automatic exchange rate conversion!

## Features

- **20+ Currencies**: Support for major world currencies
- **Automatic Conversion**: Real-time exchange rates via API
- **Smart Caching**: 24-hour cache to minimize API calls
- **Per-Expense Currency**: Each expense can have its own currency
- **Currency Flags**: Visual currency indicators with country flags
- **Default Currency**: Set your preferred currency in profile

## Supported Currencies

| Currency | Code | Symbol | Flag |
|----------|------|--------|------|
| US Dollar | USD | $ | 🇺🇸 |
| Euro | EUR | € | 🇪🇺 |
| British Pound | GBP | £ | 🇬🇧 |
| Japanese Yen | JPY | ¥ | 🇯🇵 |
| Chinese Yuan | CNY | ¥ | 🇨🇳 |
| Indian Rupee | INR | ₹ | 🇮🇳 |
| Australian Dollar | AUD | A$ | 🇦🇺 |
| Canadian Dollar | CAD | C$ | 🇨🇦 |
| Swiss Franc | CHF | Fr | 🇨🇭 |
| And 11+ more... | | | |

## How to Use

### Adding Expenses in Different Currencies

1. Navigate to "Add Expense"
2. Enter the amount
3. Select currency from the dropdown
4. The amount is stored in the selected currency
5. Backend converts to your default currency for budgets

### Setting Default Currency

1. Go to Profile page
2. Update "Default Currency" field
3. All budget calculations use this currency
4. Existing expenses remain in their original currency

### Viewing Multi-Currency Expenses

In the Expenses list:
- Each expense shows in its original currency
- Currency symbol displayed next to amount
- Filter and search work across all currencies

## Technical Details

### Exchange Rate API

We use the free tier of ExchangeRate-API.com:
- **Rate Limit**: 1,500 requests/month (free tier)
- **Update Frequency**: Daily updates
- **Caching**: 24-hour local cache in database
- **Fallback**: If API fails, uses last cached rate

### Database Schema

```sql
-- Expenses table columns
currency: text (default 'USD')
original_amount: numeric (amount in original currency)
exchange_rate: numeric (rate used for conversion)

-- Exchange rates cache table
base_currency: text
target_currency: text
rate: numeric
updated_at: timestamp
```

### Conversion Logic

1. **Adding Expense**:
   - User selects currency
   - Amount stored with currency code
   - Conversion rate fetched/cached
   - Budget calculations use default currency

2. **Exchange Rate Fetching**:
   ```typescript
   // Check cache first (24h expiry)
   const cachedRate = await getCachedRate(from, to);
   
   if (cached && !expired) {
     return cachedRate;
   }
   
   // Fetch from API
   const rate = await fetchExchangeRate(from, to);
   
   // Update cache
   await updateCache(from, to, rate);
   ```

3. **Budget Tracking**:
   - All expenses converted to default currency
   - Budget limits set in default currency
   - Alerts compare converted amounts

## Usage Examples

### Example 1: International Trip
```
You're traveling from USA (USD) to Europe (EUR):

1. Set default currency: USD
2. Add expenses in EUR during trip
3. View spending in USD for budgets
4. Each expense retains original EUR amount
```

### Example 2: Freelance Income
```
Receiving payments in multiple currencies:

1. Add income as negative expenses
2. Each payment in its currency (USD, EUR, GBP)
3. Track total income in default currency
4. Export shows all original currencies
```

### Example 3: Multi-Country Business
```
Business with offices in different countries:

1. Each office tracks in local currency
2. Expenses tagged by location
3. Consolidated reports in HQ currency
4. Historical rates preserved
```

## API Configuration

### Using Default API (ExchangeRate-API)

No configuration needed! Works out of the box:
- Free tier: 1,500 requests/month
- No API key required
- Cached rates minimize requests

### Using Alternative API

To use a different exchange rate API:

1. Edit `supabase/functions/currency-converter/index.ts`
2. Replace API endpoint:
```typescript
// Change from:
const response = await fetch(
  `https://api.exchangerate-api.com/v4/latest/${from}`
);

// To your preferred API:
const response = await fetch(
  `https://your-api.com/rates?from=${from}&to=${to}`,
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
);
```

### Popular Alternative APIs

1. **OpenExchangeRates.org**
   - Free: 1,000 requests/month
   - Paid: from $12/month
   - Best for: High-frequency updates

2. **CurrencyAPI.com**
   - Free: 300 requests/month
   - Paid: from $10/month
   - Best for: Multiple base currencies

3. **Fixer.io**
   - Free: 100 requests/month
   - Paid: from $10/month
   - Best for: European currencies

## Best Practices

### 1. Consistent Currency Selection
- Set default currency once
- Use for all regular expenses
- Only change for foreign transactions

### 2. Regular Updates
- Exchange rates update daily
- Cache prevents excessive API calls
- Manual refresh available if needed

### 3. Budget Planning
- Set budgets in default currency
- Convert foreign budgets using current rates
- Review after major currency fluctuations

### 4. Historical Accuracy
- Original amounts never change
- Exchange rates preserved per transaction
- Accurate historical reporting

## Troubleshooting

### Exchange Rates Not Updating

**Check cache:**
```sql
SELECT * FROM exchange_rates 
WHERE updated_at < NOW() - INTERVAL '24 hours';
```

**Clear cache:**
```sql
DELETE FROM exchange_rates;
```

### Incorrect Conversions

1. Verify exchange rate in database
2. Check API response in edge function logs
3. Confirm original amount is correct
4. Validate currency code (must be 3-letter ISO)

### API Limit Reached

**Monitor usage:**
- Check edge function logs
- Count API calls per day
- Verify cache is working

**Solutions:**
- Increase cache duration (48h or 72h)
- Upgrade API tier
- Switch to alternative API

## Currency Display

### Formatting Rules

```typescript
// Format with symbol
formatCurrency(100.50, 'USD') // → "$100.50"
formatCurrency(100.50, 'EUR') // → "€100.50"
formatCurrency(100.50, 'JPY') // → "¥100.50"

// Get symbol only
getCurrencySymbol('GBP') // → "£"
```

### Locale-Aware Formatting

For locale-specific formatting:
```typescript
const formatted = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(amount);
```

## Data Export

Multi-currency data in exports:
- CSV includes currency column
- JSON preserves all currency fields
- Original amounts always included
- Conversion rates documented

## Performance

### Optimization Tips

1. **Cache Management**
   - 24h cache = ~60 API calls/month
   - 48h cache = ~30 API calls/month
   - Balance freshness vs. API limits

2. **Batch Conversions**
   - Convert multiple expenses together
   - Reuse rates for same currency pair
   - Minimize edge function calls

3. **Database Indexes**
   - Index on currency column
   - Index on exchange_rates pairs
   - Fast lookups for conversions

## Future Enhancements

Planned features:
- Offline currency support
- Historical rate charts
- Currency fluctuation alerts
- Crypto currency support
- Custom exchange rates

## Need Help?

- Review edge function logs for API errors
- Check `exchange_rates` table for cached data
- Verify currency codes are valid ISO 4217
- Test conversion with small amounts first
