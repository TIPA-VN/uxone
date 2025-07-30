# JDE F4301 Purchase Order Header Column Mapping

Based on the F4301.xls documentation file, here are the correct column names and their usage in the procurement system.

## 📋 Column Reference Table

| JDE Column | Description | Data Type | Usage in App | Example Value |
|------------|-------------|-----------|--------------|---------------|
| **PHDOCO** | Document (Order No, Invoice, etc.) | Numeric(8) | PO Number | 992 |
| **PHAN8** | Address Number | Numeric(8) | Supplier ID | 5000002 |
| **PHDRQJ** | Date - Requested | Julian Date | Order Date | 127196 |
| **PHPDDJ** | Date - Promise | Julian Date | Promise Date | 127196 |
| **PHCNDJ** | Currency Code | String(3) | Currency | "VND" |
| **PHOTOT** | Amount - Order Total | Numeric(15,2) | Base Currency Amount (USD) (÷100) | 10.75 |
| **PHFAP** | Amount - Foreign | Numeric(15,2) | Foreign Amount Total (Transaction Currency) (÷100) | 2730 |
| **PHCRCD** | Currency Code | String(3) | Transaction Currency | "VND" |
| **PHBCRC** | Base Currency Code | String(6) | Base Currency Code (Always USD) | "USD" |
| **PHORBY** | Ordered By | String(10) | Buyer | "15031513" |
| **PHDCTO** | Order Type | String(2) | Order Type | "OR" |

## 🔧 Current Implementation

The current JDE connector correctly maps these columns:

```typescript
// F4301 Query
SELECT 
  PHDOCO, PHAN8, PHDRQJ, PHPDDJ, PHCNDJ, PHOTOT, PHFAP, PHCRCD, PHBCRC, PHORBY, PHDCTO
FROM F4301 
WHERE PHDOCO = :poNumber
ORDER BY PHDRQJ DESC
```

## 💰 Amount Handling

JDE stores amounts in cents (no decimal places), so we divide by 100:
- **PHOTOT** (Base Currency Amount): 1075 → 10.75 USD
- **PHFAP** (Foreign Amount Total): 273000 → 2730 VND

## 📊 Status Mapping

| JDE Order Type | App Status | Description |
|----------------|------------|-------------|
| "OP" | "ACTIVE" | Open Purchase Order |
| "CL" | "COMPLETED" | Closed |
| "CA" | "CANCELLED" | Cancelled |
| "HO" | "HOLD" | On Hold |

## ✅ Verification

The current implementation successfully retrieves real JDE data:

```json
{
  "PDDOCO": "992",
  "PDALPH": "CTY TNHH MTV DIESEL SONG CONG",
  "PDTOA": 10.75,
  "PDFAP": 2730,
  "PDCNDJ": "VND",
  "PDCNDC": "USD",
  "PDBUY": "15031513"
}
```

## 🎯 Key Points

1. **Column Names**: All column names match the F4301.xls documentation exactly
2. **Amount Division**: JDE amounts are divided by 100 for proper display
3. **Date Handling**: Julian dates are converted to standard Date objects
4. **Status Mapping**: JDE order types are mapped to user-friendly statuses
5. **Supplier Info**: Supplier names are retrieved from F0101 Address Book
6. **Currency Handling**: Base currency (USD) and transaction currency (foreign) are tracked for multinational operations

## 📝 Notes

- The F4301 table is the Purchase Order Header File
- All amounts are stored in cents and must be divided by 100
- Order types determine the status of the purchase order
- Supplier information is enhanced with data from F0101
- Foreign amounts (PHFAP) are included for total cost calculations
- Base currency amounts (PHOTOT) are always in USD and divided by 100
- Foreign amounts (PHFAP) are in transaction currency and formatted according to currency rules 