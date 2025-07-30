# Procurement AI Agent with JDE 9.2 Integration

A Next.js-based intelligent procurement system that integrates with JDE EnterpriseOne 9.2 to optimize inventory management, purchase order decisions, and MRP analysis using AI agents.

## 🎯 Project Overview

This system helps procurement teams:
- Track inventory purchases, receivings, and demands
- Compare actual data with MRP recommendations
- Prevent over-purchasing through AI-driven insights
- Manage PO and frozen PO forecasts (6 months to 1 year)
- Optimize procurement decisions with real-time AI analysis

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI   │    │   AI Agent      │    │   JDE 9.2       │
│   Dashboard     │◄──►│   Layer         │◄──►│   ERP System    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data          │    │   ML Models     │    │   Oracle/SQL    │
│   Warehouse     │    │   & Analytics   │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- JDE EnterpriseOne 9.2 access
- Oracle/SQL Server database connectivity
- OpenAI API key (or alternative AI service)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd procurement-ai-agent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables

```bash
# JDE Database Connection
JDE_DB_HOST=your-jde-db-host
JDE_DB_PORT=1521
JDE_DB_SERVICE=your-service-name
JDE_DB_USER=your-db-user
JDE_DB_PASSWORD=your-db-password

# JDE API Configuration
JDE_AIS_SERVER=your-ais-server
JDE_AIS_PORT=9999
JDE_AIS_USER=your-ais-user
JDE_AIS_PASSWORD=your-ais-password

# AI Service Configuration
OPENAI_API_KEY=your-openai-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=your-pinecone-env

# Database for Analytics
DATABASE_URL=postgresql://user:password@localhost:5432/procurement_ai

# Redis for Caching
REDIS_URL=redis://localhost:6379
```

## 📁 Project Structure

```
/procurement-ai-app
├── /pages
│   ├── /api
│   │   ├── /jde                    # JDE integration endpoints
│   │   │   ├── inventory.ts        # Item master & locations (F4101, F4102)
│   │   │   ├── purchase-orders.ts  # PO data (F4301, F4311)
│   │   │   ├── receipts.ts         # Purchase receipts (F4312)
│   │   │   ├── mrp-data.ts         # MRP messages (F3411, F3412)
│   │   │   └── demands.ts          # Sales orders (F4211)
│   │   ├── /ai-agent               # AI agent endpoints
│   │   │   ├── recommendations.ts  # Purchase recommendations
│   │   │   ├── analysis.ts         # Inventory analysis
│   │   │   ├── forecast.ts         # Demand forecasting
│   │   │   └── risk-assessment.ts  # Over-purchase risk analysis
│   │   └── /sync
│   │       ├── real-time.ts        # Real-time data sync
│   │       └── batch.ts            # Batch processing
│   ├── dashboard.tsx               # Main dashboard
│   ├── inventory.tsx               # Inventory management
│   ├── purchase-orders.tsx         # PO management
│   ├── mrp-analysis.tsx           # MRP insights
│   └── frozen-po.tsx              # Frozen PO forecasting
├── /components
│   ├── /charts                     # Data visualizations
│   │   ├── InventoryChart.tsx
│   │   ├── POChart.tsx
│   │   └── DemandChart.tsx
│   ├── /ai-insights               # AI-powered components
│   │   ├── RecommendationCard.tsx
│   │   ├── RiskAlert.tsx
│   │   └── ForecastChart.tsx
│   ├── /jde-integration           # JDE-specific components
│   │   ├── JDEDataTable.tsx
│   │   └── SyncStatus.tsx
│   └── /ui                        # Reusable UI components
├── /lib
│   ├── jde-connector.ts           # JDE database & API connector
│   ├── ai-agent.ts                # AI agent core logic
│   ├── database.ts                # Analytics database
│   ├── redis.ts                   # Caching layer
│   └── utils.ts                   # Utility functions
├── /services
│   ├── procurement-ai.ts          # Main AI service
│   ├── data-sync.ts               # Data synchronization
│   ├── mrp-analyzer.ts            # MRP analysis service
│   └── supplier-analyzer.ts       # Supplier performance
├── /types
│   ├── jde.ts                     # JDE data types
│   ├── ai.ts                      # AI-related types
│   └── procurement.ts             # Business logic types
└── /models
    ├── demand-forecast.ts         # Demand forecasting ML model
    ├── inventory-optimizer.ts     # Inventory optimization
    └── risk-predictor.ts          # Risk prediction model
```

## 🔗 JDE 9.2 Integration

### Key JDE Tables

| Table | Description | Usage |
|-------|-------------|-------|
| F4101 | Item Master | Product information, lead times |
| F4102 | Item Location | Inventory by location |
| F41021 | Item Location Detail | Lot/serial tracking |
| F4301 | Purchase Order Header | PO basic information |
| F4311 | Purchase Order Detail | Line items, quantities |
| F4312 | Receipts Detail | Goods received |
| F3411 | MRP/MPS Messages | Planning recommendations |
| F3412 | MRP/MPS Detail | Detailed planning data |
| F4211 | Sales Order Detail | Customer demands |
| F0401 | Supplier Master | Vendor information |

### Integration Methods

1. **AIS (Application Interface Services)**
   ```typescript
   // Example AIS call
   const jdeService = new JDEService({
     server: process.env.JDE_AIS_SERVER,
     port: process.env.JDE_AIS_PORT
   })
   
   const inventory = await jdeService.callService('GetItemAvailability', {
     itemNumber: 'ITEM001',
     branch: '00001'
   })
   ```

2. **Direct Database Access**
   ```typescript
   // Example direct DB query
   const inventoryQuery = `
     SELECT IMITM, IMLITM, IMQOH, IMQOO 
     FROM F4101 
     WHERE IMITM = ? AND IMMCU = ?
   `
   ```

3. **REST Services**
   ```typescript
   // JDE REST endpoint
   const response = await fetch(`${JDE_REST_URL}/inventory/${itemNumber}`, {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   ```

## 🤖 AI Agent Implementation

### Core AI Components

```typescript
// AI Agent Configuration
const procurementAgent = {
  name: 'ProcurementOptimizer',
  memory: {
    vectorStore: 'pinecone',
    contextWindow: 32000
  },
  tools: [
    'jde-data-fetcher',
    'mrp-analyzer', 
    'demand-forecaster',
    'supplier-evaluator',
    'risk-assessor',
    'inventory-optimizer'
  ],
  llm: 'gpt-4-turbo'
}
```

### AI Capabilities

1. **Demand Forecasting**
   - Seasonal pattern analysis
   - Trend detection
   - External factor correlation

2. **Inventory Optimization**
   - Safety stock calculation
   - Reorder point optimization
   - ABC analysis enhancement

3. **Purchase Recommendations**
   - Quantity optimization
   - Timing suggestions
   - Supplier selection

4. **Risk Assessment**
   - Over-purchasing alerts
   - Supplier risk evaluation
   - Lead time variability analysis

## 📊 Key Features

### Real-time Dashboard
- Live inventory levels
- PO status tracking
- MRP recommendations
- AI insights and alerts

### Smart Purchase Orders
- AI-powered quantity suggestions
- Lead time optimization
- Supplier performance integration

### MRP Enhancement
- AI-augmented planning
- Exception management
- Forecast accuracy improvement

### Frozen PO Management
- Long-term forecast tracking
- Change impact analysis
- Commitment optimization

## 🔄 Data Flow

```mermaid
graph TD
    A[JDE 9.2] --> B[Data Sync Service]
    B --> C[Analytics Database]
    C --> D[AI Agent]
    D --> E[Recommendations]
    E --> F[Next.js Dashboard]
    F --> G[User Actions]
    G --> A
```

## 🚀 Development Phases

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up Next.js with TypeScript
- [ ] Configure JDE connectivity
- [ ] Create basic data models
- [ ] Implement authentication
- [ ] Set up development environment

### Phase 2: Data Integration (Weeks 5-8)
- [ ] Build JDE data synchronization
- [ ] Create real-time pipelines
- [ ] Implement caching with Redis
- [ ] Set up analytics database
- [ ] Create API endpoints

### Phase 3: AI Agent Development (Weeks 9-12)
- [ ] Train demand forecasting models
- [ ] Implement recommendation engine
- [ ] Build agent reasoning capabilities
- [ ] Create feedback loops
- [ ] Integrate with UI components

### Phase 4: Advanced Features (Weeks 13-16)
- [ ] Frozen PO management
- [ ] Supplier performance analytics
- [ ] Advanced risk assessment
- [ ] Comprehensive reporting
- [ ] Performance optimization

## 🧪 Testing Strategy

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# AI model validation
npm run test:ai-models
```

## 📦 Deployment

### Production Setup

```bash
# Build application
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel deploy
```

### Docker Setup

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuration

### AI Model Configuration

```typescript
// config/ai.ts
export const aiConfig = {
  models: {
    demandForecast: {
      type: 'lstm',
      lookbackPeriods: 12,
      forecastHorizon: 6
    },
    inventoryOptimization: {
      type: 'reinforcement_learning',
      algorithm: 'ddpg'
    },
    riskAssessment: {
      type: 'ensemble',
      models: ['xgboost', 'random_forest']
    }
  }
}
```

### JDE Configuration

```typescript
// config/jde.ts
export const jdeConfig = {
  database: {
    type: 'oracle', // or 'sqlserver'
    pool: {
      min: 2,
      max: 10,
      idle: 30000
    }
  },
  api: {
    timeout: 30000,
    retries: 3
  },
  sync: {
    batchSize: 1000,
    interval: 300000 // 5 minutes
  }
}
```

## 📚 API Documentation

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jde/inventory` | GET | Get inventory data |
| `/api/jde/purchase-orders` | GET | Get PO information |
| `/api/ai-agent/recommendations` | POST | Get AI recommendations |
| `/api/ai-agent/forecast` | POST | Get demand forecast |
| `/api/sync/trigger` | POST | Trigger data sync |

### Example API Usage

```typescript
// Get inventory recommendations
const response = await fetch('/api/ai-agent/recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itemNumber: 'ITEM001',
    location: '00001',
    analysisType: 'inventory_optimization'
  })
})

const recommendations = await response.json()
```

## 🔒 Security Considerations

- JDE credentials stored in secure environment variables
- API endpoints protected with authentication middleware
- Sensitive data encrypted at rest and in transit
- Regular security audits and dependency updates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions and support:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## 📈 Roadmap

- [ ] Multi-location inventory optimization
- [ ] Advanced supplier scoring algorithms
- [ ] Integration with additional ERP systems
- [ ] Mobile application development
- [ ] Advanced analytics and reporting
- [ ] Machine learning model improvements