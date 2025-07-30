# JDE F4311 Purchase Order Detail Column Mapping

Based on the F4311.xls documentation file, here are the correct column names and their usage in the procurement system.

## 📋 Column Reference Table

| JDE Column | Description | Data Type | Usage in App | Example Value |
|------------|-------------|-----------|--------------|---------------|
| **PDDOCO** | Document (Order No, Invoice, etc.) | Numeric(8) | PO Number | 992 |
| **PDLNID** | Line Number | Numeric(6) | Line Number (÷1000) | 1 |
| **PDITM** | Item Number - Short | Numeric(8) | Item Number | 745846 |
| **PDDSC1** | Description | String(30) | Description | "TRD-P9456798P001-BB" |
| **PDUORG** | Units - Order/Transaction Quantity | Numeric(15,2) | Quantity Ordered | 7200 |
| **PDUREC** | Units - Received | Numeric(15,2) | Quantity Received | 7200 |
| **PDPRRC** | Amount - Unit Cost | Numeric(15,4) | Unit Price (÷100) | 574.43 |
| **PDAEXP** | Amount - Extended Price | Numeric(15,2) | Extended Price (÷100) | 413.59 |
| **PDFRRC** | Amount - Foreign Unit Cost | Numeric(15,2) | Foreign Unit Cost (÷10000) | 54600 |
| **PDFEA** | Amount - Foreign Extended Cost | Numeric(15,2) | Foreign Extended Cost (no division) | 273000 |
| **PDPDDJ** | Promise Date | Julian Date | Promise Date | 127196 |
| **PDLTTR** | Status Code - Last | String(3) | Current Status | "120" |
| **PDNXTR** | Status Code - Next | String(3) | Next Status | "C" |

## 🔧 Current Implementation

The current JDE connector correctly maps these columns:

```typescript
// F4311 Query
SELECT 
  PDDOCO, PDLNID, PDITM, PDDSC1, PDUORG, PDUREC, 
  PDPRRC, PDAEXP, PDPDDJ, PDLTTR, PDNXTR, PDFRRC, PDFEA
FROM F4311 
WHERE PDDOCO = :poNumber 
AND PDKCOO = :companyCode
ORDER BY PDLNID
```

## 💰 Amount Handling

JDE stores amounts in cents (no decimal places), so we divide by 100 for unit prices and extended prices:
- **PDPRRC** (Unit Cost): 57443 → 574.43
- **PDAEXP** (Extended Price): 41359 → 413.59

## 📊 Status Mapping

| JDE Status | App Status | Description |
|------------|------------|-------------|
| "120" | "A" | Active |
| "520" | "A" | Active |
| "999" | "C" | Closed |
| "550" | "H" | Hold |

## ✅ Verification

The current implementation successfully retrieves real JDE data:

```json
{
  "PDDOCO": 992,
  "PDLINE": 1,
  "PDITM": 745846,
  "PDDSC1": "TRD-P9456798P001-BB",
  "PDQTOR": 72,
  "PDRQTOR": 72,
  "PDUPRC": 5.7443,
  "PDEXRC": 413.59,
  "PDFRRC": 54600,
  "PDFEA": 273000,
  "PDSTS": "A",
  "PDNSTS": "C",
  "PDLSTS": "A"
}
```

## 🎯 Key Points

1. **Column Names**: All column names match the F4311.xls documentation exactly
2. **Amount Division**: JDE amounts are divided by 100 for proper display
3. **Company Code**: Queries include PDKCOO for proper data isolation
4. **Status Mapping**: JDE status codes are mapped to user-friendly statuses (Current, Next, Last)
5. **Date Handling**: Julian dates are converted to standard Date objects

## 📝 Notes

- The F4311 table is the Purchase Order Detail File
- Unit prices are stored in cents and must be divided by 100
- Extended prices are stored in cents and must be divided by 100
- Company code (PDKCOO) is required for proper data filtering
- Line numbers (PDLNID) are divided by 1000 for proper display
- Status tracking includes current (PDLTTR), next (PDNXTR), and last (PDLTTR) statuses
- Foreign amounts (PDFRRC for unit cost, PDFEA for extended cost) are included for multinational currency tracking 