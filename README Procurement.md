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

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Redis server
- JDE EnterpriseOne 9.2 access (optional for development)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd procurement-ai-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
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

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Or run migrations
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
/procurement-ai-app
├── /app                          # Next.js App Router
│   ├── /api                      # API routes
│   │   ├── /jde                  # JDE integration endpoints
│   │   ├── /ai-agent             # AI agent endpoints
│   │   └── /sync                 # Data synchronization
│   ├── /inventory                # Inventory management pages
│   ├── /purchase-orders          # PO management pages
│   ├── /mrp-analysis            # MRP insights pages
│   └── /frozen-po               # Frozen PO forecasting
├── /components                   # React components
│   ├── /charts                  # Data visualizations
│   ├── /ai-insights            # AI-powered components
│   ├── /jde-integration        # JDE-specific components
│   └── /ui                     # Reusable UI components
├── /lib                         # Core libraries
│   ├── jde-connector.ts        # JDE database & API connector
│   ├── ai-agent.ts             # AI agent core logic
│   ├── database.ts             # Analytics database
│   ├── redis.ts                # Caching layer
│   └── utils.ts                # Utility functions
├── /services                   # Business logic services
├── /types                      # TypeScript type definitions
├── /models                     # ML models and algorithms
├── /config                     # Configuration files
└── /prisma                     # Database schema and migrations
```

## 🔗 JDE 9.2 Integration

### Key JDE Tables

| Table | Description | Usage |
|-------|-------------|-------|
| F4101 | Item Master | Product information, lead times |
| F4102 | Item Location | Inventory by location |
| F4301 | Purchase Order Header | PO basic information |
| F4311 | Purchase Order Detail | Line items, quantities |
| F4312 | Receipts Detail | Goods received |
| F3411 | MRP/MPS Messages | Planning recommendations |
| F4211 | Sales Order Detail | Customer demands |

### Integration Methods

1. **Direct Database Access** - Connect directly to JDE Oracle/SQL Server database
2. **AIS (Application Interface Services)** - Use JDE REST services
3. **REST Services** - Custom JDE REST endpoints

## 🤖 AI Agent Features

### Core Capabilities

- **Demand Forecasting**: Seasonal pattern analysis and trend detection
- **Inventory Optimization**: Safety stock calculation and reorder point optimization
- **Purchase Recommendations**: Quantity optimization and supplier selection
- **Risk Assessment**: Over-purchasing alerts and supplier risk evaluation

### AI Models

- **LSTM Networks**: For demand forecasting
- **Reinforcement Learning**: For inventory optimization
- **Ensemble Models**: For risk assessment

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

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check
```

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment

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

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JDE_DB_HOST` | JDE database host | Yes |
| `JDE_DB_PORT` | JDE database port | Yes |
| `JDE_DB_USER` | JDE database user | Yes |
| `JDE_DB_PASSWORD` | JDE database password | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |

### AI Configuration

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
    }
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

### Example Usage

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
});

const recommendations = await response.json();
```

## 🔒 Security

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

## 🏗️ Development Phases

### Phase 1: Foundation ✅
- [x] Set up Next.js with TypeScript
- [x] Configure JDE connectivity
- [x] Create basic data models
- [x] Set up development environment

### Phase 2: Data Integration (In Progress)
- [ ] Build JDE data synchronization
- [ ] Create real-time pipelines
- [ ] Implement caching with Redis
- [ ] Set up analytics database
- [ ] Create API endpoints

### Phase 3: AI Agent Development
- [ ] Train demand forecasting models
- [ ] Implement recommendation engine
- [ ] Build agent reasoning capabilities
- [ ] Create feedback loops
- [ ] Integrate with UI components

### Phase 4: Advanced Features
- [ ] Frozen PO management
- [ ] Supplier performance analytics
- [ ] Advanced risk assessment
- [ ] Comprehensive reporting
- [ ] Performance optimization 