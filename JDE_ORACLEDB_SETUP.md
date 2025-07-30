# JDE 9.2 OracleDB Connection Setup Guide

## 🎯 Real JDE Database Integration

This guide covers setting up real OracleDB connections to JDE 9.2 for querying actual data.

## 📋 Prerequisites

### 1. OracleDB Driver Installation
```bash
# Install OracleDB driver
npm install oracledb

# Install TypeScript types
npm install --save-dev @types/oracledb
```

### 2. Oracle Client Libraries
The `oracledb` package requires Oracle Client libraries to be installed on your system.

#### **macOS Installation:**
```bash
# Using Homebrew
brew install oracle-instantclient

# Or download from Oracle website
# https://www.oracle.com/database/technologies/instant-client/macos-intel-x86-downloads.html
```

#### **Linux Installation:**
```bash
# Ubuntu/Debian
sudo apt-get install oracle-instantclient-basic

# CentOS/RHEL
sudo yum install oracle-instantclient-basic
```

#### **Windows Installation:**
Download and install Oracle Instant Client from:
https://www.oracle.com/database/technologies/instant-client/winx64-downloads.html

### 3. Environment Variables
Set up your `.env.local` file with JDE connection details:

```bash
# JDE Database Connection
JDE_DB_HOST=your-jde-server-ip
JDE_DB_PORT=1521
JDE_DB_SERVICE=JDE
JDE_DB_USER=your-jde-username
JDE_DB_PASSWORD=your-jde-password

# Optional: Oracle Client Path (if not in system PATH)
ORACLE_HOME=/path/to/oracle/instantclient
```

## 🔧 JDE Table Structure

### Key JDE Tables for Procurement

#### **F4101 - Item Master**
```sql
-- Main item information
SELECT 
  IMITM,    -- Item Number
  IMLITM,   -- Item Description
  IMTYP,    -- Item Type
  IMUM,     -- Unit of Measure
  IMLT,     -- Lead Time
  IMSSQ,    -- Safety Stock
  IMMOQ,    -- Minimum Order Quantity
  IMMXQ,    -- Maximum Order Quantity
  IMLOTS,   -- Lot Size
  IMCC,     -- Cost Center
  IMPL,     -- Planner
  IMBUY     -- Buyer
FROM F4101 
WHERE ROWNUM <= 100;
```

#### **F4102 - Item Location**
```sql
-- Inventory by location
SELECT 
  IMITM,    -- Item Number
  IMBR,     -- Branch
  IMLOC,    -- Location
  IMQOH,    -- Quantity On Hand
  IMQOO,    -- Quantity On Order
  IMQC,     -- Quantity Committed
  IMCDT,    -- Last Count Date
  IMCQ      -- Last Count Quantity
FROM F4102 
WHERE IMITM = 'ITEM001';
```

#### **F4301 - Purchase Order Header**
```sql
-- Purchase order headers
SELECT 
  PDDOCO,   -- PO Number
  PDAN8,    -- Supplier ID
  PDALPH,   -- Supplier Name
  PDRQDC,   -- Order Date
  PDPDDJ,   -- Promise Date
  PDSTS,    -- Status
  PDTOA,    -- Total Amount
  PDCNDJ,   -- Currency
  PDBUY     -- Buyer
FROM F4301 
WHERE PDSTS = 'A'  -- Active POs
AND ROWNUM <= 50;
```

#### **F4311 - Purchase Order Detail**
```sql
-- Purchase order line items
SELECT 
  PDDOCO,   -- PO Number
  PDLINE,   -- Line Number
  PDITM,    -- Item Number
  PDDSC1,   -- Description
  PDQTOR,   -- Quantity
  PDRQTOR,  -- Quantity Received
  PDUPRC,   -- Unit Price
  PDEXRC,   -- Extended Price
  PDPDDJ,   -- Promise Date
  PDSTS     -- Status
FROM F4311 
WHERE PDDOCO = 'PO001'
ORDER BY PDLINE;
```

#### **F4312 - Receipts Detail**
```sql
-- Goods received
SELECT 
  PDDOCO,   -- PO Number
  PDLINE,   -- Line Number
  PDITM,    -- Item Number
  RCRORN,   -- Receipt Number
  RCRCDJ,   -- Receipt Date
  RCQTOR,   -- Quantity Received
  RCUPRC,   -- Unit Cost
  RCLOTN,   -- Lot Number
  RCLOCN    -- Location
FROM F4312 
WHERE PDDOCO = 'PO001';
```

#### **F3411 - MRP Messages**
```sql
-- MRP planning messages
SELECT 
  MMITM,    -- Item Number
  MMMSG,    -- Message Type
  MMTEXT,   -- Message Text
  MMQTY,    -- Quantity
  MMDATE,   -- Date
  MMPRI,    -- Priority
  MMSTS     -- Status
FROM F3411 
WHERE MMSTS = 'A'  -- Active messages
AND ROWNUM <= 100;
```

## 🧪 Testing the Connection

### 1. Basic Connection Test
```bash
# Test endpoint
GET /api/jde/test-oracle
```

### 2. Using the Testing Interface
1. Navigate to `/lvm/procurement/jde-testing`
2. Click "Test Connection" to verify OracleDB connectivity
3. Click "Test POs" to query real purchase orders
4. Click "Test Inventory" to query real item master data

### 3. Manual Testing with curl
```bash
# Test OracleDB connection
curl -X GET "http://localhost:3000/api/jde/test-oracle"

# Test inventory data
curl -X GET "http://localhost:3000/api/jde/inventory"

# Test purchase orders
curl -X GET "http://localhost:3000/api/jde/purchase-orders"

# Test specific PO with details
curl -X GET "http://localhost:3000/api/jde/purchase-orders?poNumber=PO001&includeDetails=true"
```

## 🔍 Troubleshooting

### Common Connection Issues

#### 1. Oracle Client Not Found
**Error**: `DPI-1047: Cannot locate a 64-bit Oracle Client library`
**Solution**:
```bash
# Set Oracle Home environment variable
export ORACLE_HOME=/path/to/oracle/instantclient
export LD_LIBRARY_PATH=$ORACLE_HOME:$LD_LIBRARY_PATH

# For macOS
export DYLD_LIBRARY_PATH=$ORACLE_HOME:$DYLD_LIBRARY_PATH
```

#### 2. Connection Refused
**Error**: `ORA-12541: TNS:no listener`
**Solutions**:
- Verify JDE server IP and port
- Check if JDE database is running
- Verify network connectivity
- Check firewall settings

#### 3. Authentication Failed
**Error**: `ORA-01017: invalid username/password`
**Solutions**:
- Verify JDE username and password
- Check if user has proper permissions
- Ensure user is not locked

#### 4. Service Not Found
**Error**: `ORA-12514: TNS:listener does not currently know of service`
**Solutions**:
- Verify service name (usually 'JDE')
- Check if service is registered with listener
- Try using SID instead of service name

### Debug Commands

#### Test Oracle Client Installation
```bash
# Check if Oracle client is installed
ls -la $ORACLE_HOME

# Test basic connectivity
sqlplus username/password@host:port/service
```

#### Check Environment Variables
```bash
# Verify Oracle environment
echo $ORACLE_HOME
echo $LD_LIBRARY_PATH
echo $DYLD_LIBRARY_PATH

# Check JDE connection variables
echo $JDE_DB_HOST
echo $JDE_DB_PORT
echo $JDE_DB_SERVICE
```

## 📊 Performance Optimization

### Query Optimization
```sql
-- Use indexes for better performance
SELECT /*+ INDEX(F4101, F4101_IMITM_IDX) */ 
  IMITM, IMLITM, IMTYP
FROM F4101 
WHERE IMITM = 'ITEM001';

-- Limit result sets
SELECT * FROM F4301 
WHERE PDSTS = 'A' 
AND ROWNUM <= 100
ORDER BY PDRQDC DESC;
```

### Connection Pooling
The current implementation creates a new connection for each request. For production, consider implementing connection pooling:

```typescript
// Example connection pool configuration
const poolConfig = {
  user: process.env.JDE_DB_USER,
  password: process.env.JDE_DB_PASSWORD,
  connectString: `${process.env.JDE_DB_HOST}:${process.env.JDE_DB_PORT}/${process.env.JDE_DB_SERVICE}`,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1
};
```

## 🔒 Security Considerations

### 1. Credential Management
- Store credentials in environment variables
- Use encrypted configuration files
- Rotate passwords regularly
- Use read-only database users when possible

### 2. Network Security
- Use VPN for database connections
- Implement firewall rules
- Use SSL/TLS for database connections
- Monitor connection logs

### 3. Query Security
- Use parameterized queries (already implemented)
- Validate input parameters
- Implement row-level security
- Audit database access

## 🚀 Production Deployment

### Environment Configuration
```bash
# Production environment variables
JDE_DB_HOST=prod-jde-server
JDE_DB_PORT=1521
JDE_DB_SERVICE=JDE_PROD
JDE_DB_USER=jde_readonly_user
JDE_DB_PASSWORD=secure_password

# Enable connection pooling
ORACLE_POOL_MIN=5
ORACLE_POOL_MAX=20
```

### Monitoring
- Monitor connection pool usage
- Track query performance
- Set up alerts for connection failures
- Log database access for audit

## 📞 Support

For JDE database connectivity issues:

1. **Check the test endpoint**: `/api/jde/test-oracle`
2. **Review server logs** for detailed error messages
3. **Verify Oracle client installation**
4. **Test with sqlplus** to isolate connection issues
5. **Contact JDE administrator** for database access

## 🎯 Success Criteria

Real JDE integration is successful when:

1. ✅ OracleDB connection established
2. ✅ F4101 (Item Master) queries return data
3. ✅ F4301 (PO Headers) queries return data
4. ✅ F4311 (PO Details) queries return data
5. ✅ Data synchronization works with real data
6. ✅ Performance is acceptable for production use
7. ✅ Error handling works with real JDE errors

Once these criteria are met, you have a fully functional JDE 9.2 integration! 🎉 