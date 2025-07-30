# JDE 9.2 Integration Testing Guide

## 🎯 Phase 2: JDE Database Integration Testing

This guide covers the testing of JDE 9.2 database integration for the procurement system.

## 📋 Prerequisites

### Environment Variables
Ensure these environment variables are set in your `.env.local` file:

```bash
# JDE Database Connection
JDE_DB_HOST=your-jde-db-host
JDE_DB_PORT=1521
JDE_DB_SERVICE=your-service-name
JDE_DB_USER=your-db-user
JDE_DB_PASSWORD=your-db-password

# JDE AIS Configuration
JDE_AIS_SERVER=your-ais-server
JDE_AIS_PORT=9999
JDE_AIS_USER=your-ais-user
JDE_AIS_PASSWORD=your-ais-password

# Database for Analytics
DATABASE_URL=postgresql://user:password@localhost:5432/procurement_ai
```

### Database Setup
The JDE models have been added to the Prisma schema and migrated:

```bash
# Run migration (already done)
npx prisma migrate dev --name add_jde_models

# Generate Prisma client
npx prisma generate
```

## 🧪 Testing Interface

### Access the Testing Page
1. Navigate to `/lvm/procurement/jde-testing`
2. Use procurement department credentials:
   - Username: `procurement` / Password: `proc123`
   - Username: `procurement_staff` / Password: `proc123`

### Testing Features

#### 1. Connection Status
- **Purpose**: Test JDE database and AIS connectivity
- **Endpoint**: `GET /api/jde/connection`
- **What it tests**:
  - Database connection to JDE
  - AIS server connectivity
  - Environment configuration
  - Connection parameters

#### 2. Inventory Data Testing
- **Purpose**: Test Item Master (F4101) and Item Location (F4102) data retrieval
- **Endpoint**: `GET /api/jde/inventory`
- **What it tests**:
  - Item master data retrieval
  - Item location data retrieval
  - Data filtering by item number and branch
  - Mock data generation for testing

#### 3. Purchase Orders Testing
- **Purpose**: Test Purchase Order Header (F4301) and Detail (F4311) data retrieval
- **Endpoint**: `GET /api/jde/purchase-orders`
- **What it tests**:
  - Purchase order header data
  - Purchase order detail lines
  - Data filtering by PO number
  - Mock PO data generation

#### 4. MRP Messages Testing
- **Purpose**: Test MRP Messages (F3411) data retrieval
- **Endpoint**: `GET /api/jde/mrp`
- **What it tests**:
  - MRP message retrieval
  - Message type filtering
  - Priority and status handling
  - Mock MRP data generation

#### 5. Data Synchronization
- **Purpose**: Sync JDE data to local PostgreSQL database
- **Endpoint**: `POST /api/jde/connection`
- **What it tests**:
  - Data transformation from JDE format to local schema
  - Upsert operations for data consistency
  - Sync logging and error handling
  - Performance of bulk operations

## 🔧 API Endpoints Reference

### Connection Testing
```bash
# Test connection
GET /api/jde/connection

# Sync data
POST /api/jde/connection
```

### Inventory Data
```bash
# Get all inventory
GET /api/jde/inventory

# Get specific item
GET /api/jde/inventory?itemNumber=ITEM001

# Get item by branch
GET /api/jde/inventory?branch=00001
```

### Purchase Orders
```bash
# Get all POs
GET /api/jde/purchase-orders

# Get specific PO
GET /api/jde/purchase-orders?poNumber=PO001

# Get PO with details
GET /api/jde/purchase-orders?poNumber=PO001&includeDetails=true
```

### MRP Messages
```bash
# Get all MRP messages
GET /api/jde/mrp

# Get messages for specific item
GET /api/jde/mrp?itemNumber=ITEM001

# Get messages by type
GET /api/jde/mrp?messageType=PURCHASE
```

## 📊 Expected Test Results

### Connection Test
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "timestamp": "2025-01-30T04:44:01.000Z",
    "environment": "development",
    "dbHost": "localhost",
    "dbPort": "1521",
    "dbService": "JDE",
    "aisServer": "localhost",
    "aisPort": "9999"
  }
}
```

### Inventory Test
```json
{
  "success": true,
  "data": {
    "itemMaster": [
      {
        "IMITM": "ITEM001",
        "IMLITM": "Raw Material A",
        "IMTYP": "P",
        "IMUM": "EA",
        "IMLT": 14,
        "IMSSQ": 100,
        "IMMOQ": 50,
        "IMMXQ": 1000,
        "IMLOTS": 100,
        "IMCC": "CC001",
        "IMPL": "PLANNER1",
        "IMBUY": "BUYER1"
      }
    ],
    "itemLocation": [
      {
        "IMITM": "ITEM001",
        "IMBR": "00001",
        "IMLOC": "A001",
        "IMQOH": 500,
        "IMQOO": 200,
        "IMQC": 50,
        "IMCDT": "2025-01-30T04:44:01.000Z",
        "IMCQ": 500
      }
    ],
    "summary": {
      "totalItems": 1,
      "totalLocations": 1,
      "timestamp": "2025-01-30T04:44:01.000Z"
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Connection Failed
**Symptoms**: Connection status shows "disconnected" or "error"
**Solutions**:
- Check environment variables are set correctly
- Verify JDE database is accessible
- Check network connectivity to JDE server
- Verify database credentials

#### 2. API Endpoints Return 500
**Symptoms**: Test results show "FAILED" with 500 status
**Solutions**:
- Check server logs for detailed error messages
- Verify Prisma client is generated: `npx prisma generate`
- Check database schema is up to date: `npx prisma migrate status`
- Verify PostgreSQL connection string

#### 3. Data Sync Fails
**Symptoms**: Sync operation returns error
**Solutions**:
- Check local database connectivity
- Verify JDE data format matches expected schema
- Check for data type mismatches
- Review sync logs in `data_sync_log` table

#### 4. Mock Data Not Loading
**Symptoms**: APIs return empty data arrays
**Solutions**:
- Check JDE service mock data generation
- Verify API endpoint implementations
- Check for JavaScript errors in browser console
- Review network requests in browser dev tools

### Debug Commands

```bash
# Check Prisma status
npx prisma migrate status

# Reset database (WARNING: destroys data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio

# Check environment variables
echo $JDE_DB_HOST
echo $JDE_DB_PORT
echo $JDE_DB_SERVICE
```

## 📈 Performance Testing

### Load Testing
Test API endpoints under load:

```bash
# Using curl for basic load testing
for i in {1..10}; do
  curl -X GET "http://localhost:3000/api/jde/inventory" &
done
wait
```

### Database Performance
Monitor database performance during sync:

```sql
-- Check sync log performance
SELECT sync_type, status, records_processed, 
       EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM data_sync_log 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔄 Next Steps

### Phase 2 Completion Checklist
- [x] JDE database models added to Prisma schema
- [x] JDE connector service implemented
- [x] API endpoints created for all JDE tables
- [x] Testing interface implemented
- [x] Mock data generation for testing
- [x] Data synchronization to local database
- [x] Error handling and logging implemented

### Phase 3 Preparation
- [ ] Real JDE database connection configuration
- [ ] AIS (Application Interface Services) integration
- [ ] Real-time data synchronization
- [ ] Performance optimization
- [ ] Production deployment configuration

## 📞 Support

For issues with JDE integration testing:

1. **Check the testing interface** at `/lvm/procurement/jde-testing`
2. **Review server logs** for detailed error messages
3. **Verify environment variables** are correctly set
4. **Test individual endpoints** using the testing interface
5. **Check database connectivity** and schema status

## 🎯 Success Criteria

Phase 2 is considered successful when:

1. ✅ All API endpoints return successful responses
2. ✅ Mock data is properly generated and displayed
3. ✅ Data synchronization works without errors
4. ✅ Error handling works correctly
5. ✅ Testing interface provides clear feedback
6. ✅ Database schema is properly migrated
7. ✅ All JDE models are accessible via Prisma

Once these criteria are met, we can proceed to Phase 3: Real JDE integration and AI agent development. 