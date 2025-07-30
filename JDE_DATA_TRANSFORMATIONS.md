# JDE Data Transformations

This document outlines all the data transformations applied to JDE data after querying from the database.

## 🔄 Data Transformation Rules

### **1. String Fields - Always Trimmed**
All string fields are converted to strings and trimmed of whitespace:
```typescript
String(field || '').trim()
```

**Examples:**
- `PDDOCO`: `992` → `"992"`
- `PDITM`: `745846` → `"745846"`
- `PDDSC1`: `"TRD-P9456798P001-BB           "` → `"TRD-P9456798P001-BB"`
- `PDCNDJ`: `"VND"` → `"VND"`
- `PDBUY`: `"15031513"` → `"15031513"`

### **2. Quantity Fields - Divided by 100**
All quantity fields are divided by 100 to convert from JDE's internal format:
```typescript
(parseInt(field) || 0) / 100
```

**Examples:**
- `PDQTOR` (Quantity Ordered): `7200` → `72`
- `PDRQTOR` (Quantity Received): `7200` → `72`

**Note:** Summary calculations in the UI use the already-divided values from the API.

### **3. Line Numbers and Sequence Numbers - Divided by 1000**
Line numbers and sequence numbers are divided by 1000 to convert from JDE's internal format:
```typescript
(parseInt(field) || 0) / 1000
```

**Examples:**
- `PDLINE` (Line Number): `1000` → `1`
- `PDLNID` (Line ID): `1000` → `1`

### **4. Currency Amounts - Currency-Specific Formatting**
Amounts are formatted based on currency type:

#### **VND (Vietnamese Dong) - Zero Decimal Places**
```typescript
amount / 100  // VND: divide by 100, no decimal places
```

#### **USD (US Dollar) - Four Decimal Places**
```typescript
amount / 10000  // USD: divide by 10000 for 4 decimal places
```

**Examples:**
- **VND Amounts:**
  - `PDPRRC` (Unit Price): `57443` → `574.43`
  - `PDAEXP` (Extended Price): `41359` → `413.59` (divided by 100)
  - `PDTOA` (Total Amount): `41359` → `413.59`

- **USD Amounts:**
  - `PDPRRC` (Unit Price): `5744300` → `574.43`
  - `PDAEXP` (Extended Price): `4135900` → `41359` (divided by 100)

**Note:** Summary calculations in the UI use the already-formatted values from the API.

### **5. Date Fields - Julian to ISO Conversion**
JDE Julian dates are converted to ISO date format:
```typescript
parseJDEDate(jdeDate)
```

**Examples:**
- `PDRQDC` (Order Date): `127196` → `"2027-07-14T00:00:00.000Z"`
- `PDPDDJ` (Promise Date): `127196` → `"2027-07-14T00:00:00.000Z"`

## 📊 Current Implementation Results

### **Purchase Order Header (F4301)**
```json
{
  "PDDOCO": "992",
  "PDALPH": "CTY TNHH MTV DIESEL SONG CONG",
  "PDTOA": 413.59,
  "PDFAP": 105026.4,
  "PDCNDJ": "VND",
  "PDCNDC": "VND",
  "PDBUY": "15031513"
}
```

### **Purchase Order Details (F4311)**
```json
{
  "PDDOCO": "992",
  "PDLINE": 1,
  "PDITM": "745846",
  "PDDSC1": "TRD-P9456798P001-BB",
  "PDQTOR": 72,
  "PDRQTOR": 72,
  "PDUPRC": 5.7443,
  "PDEXRC": 413.59,
  "PDSTS": "A",
  "PDNSTS": "C",
  "PDLSTS": "A"
}
```

### **Summary Calculations (UI)**
```typescript
// Summary calculations use already-formatted values from API
const totalQuantity = lineDetails.reduce((sum, line) => sum + line.PDQTOR, 0);
const totalReceived = lineDetails.reduce((sum, line) => sum + line.PDRQTOR, 0);
const totalValue = lineDetails.reduce((sum, line) => sum + line.PDEXRC, 0);
```

## 🔧 Implementation Details

### **Currency Formatting Function**
```typescript
private formatCurrencyAmount(amount: number, currency: string): number {
  const currencyCode = currency?.trim().toUpperCase() || 'USD';
  
  // VND has zero decimal places, USD has 4 decimal places
  if (currencyCode === 'VND') {
    return amount / 100; // VND: divide by 100, no decimal places
  } else {
    return amount / 10000; // USD: divide by 10000 for 4 decimal places
  }
}
```

**Dynamic Currency Usage:**
- **Base Currency (PHBCRC)**: Used for amount formatting when available
- **Transaction Currency (PHCRCD)**: Fallback when base currency is not available
- **Default**: USD when neither currency is specified

### **String Trimming**
```typescript
String(field || '').trim()
```

### **Quantity Conversion**
```typescript
(parseInt(field) || 0) / 100
```

### **Line Number Conversion**
```typescript
(parseInt(field) || 0) / 1000
```

### **Date Conversion**
```typescript
private parseJDEDate(jdeDate: any): Date {
  if (!jdeDate) return new Date();
  
  // If it's already a Date object, return it
  if (jdeDate instanceof Date) return jdeDate;
  
  // If it's a number (Julian date), convert it
  if (typeof jdeDate === 'number') {
    // JDE Julian date: YYYYDDD format
    const year = Math.floor(jdeDate / 1000);
    const dayOfYear = jdeDate % 1000;
    const date = new Date(year, 0, dayOfYear);
    return date;
  }
  
  // If it's a string, try to parse it
  if (typeof jdeDate === 'string') {
    const parsed = new Date(jdeDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  
  return new Date();
}
```

## ✅ Benefits

1. **Consistent Data Format**: All data is properly formatted for display
2. **Currency Accuracy**: Proper decimal places for different currencies
3. **Clean Strings**: No trailing whitespace in text fields
4. **Readable Dates**: Julian dates converted to standard ISO format
5. **Correct Quantities**: JDE quantities properly scaled for display

## 🎯 Key Points

- **VND**: Zero decimal places, divide by 100
- **USD**: Four decimal places, divide by 10000
- **Quantities**: Always divide by 100
- **Line Numbers**: Always divide by 1000
- **Extended Values**: Always divide by 100
- **Summary Calculations**: Use already-formatted values from API
- **Strings**: Always trim whitespace
- **Dates**: Convert Julian to ISO format
- **Fallbacks**: Provide sensible defaults for missing data 