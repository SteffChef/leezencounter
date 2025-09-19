# Leezencounter Web Application

A Next.js web application for monitoring and managing bike counting sensors (Leezenboxes) with real-time data visualization and management capabilities.

## 🚀 Features

- **Interactive Dashboard**: Real-time visualization of bike counting data
- **Map Integration**: Interactive map showing Leezenbox locations using Leaflet
- **Data Management**: Add, view, and manage Leezenbox sensors
- **Real-time Charts**: Data visualization using Recharts
- **Modern UI**: Built with Tailwind CSS and Radix UI components
- **Database Integration**: PostgreSQL database for data persistence
- **API Endpoints**: RESTful APIs for data management
- **Cron Jobs**: Automated data processing with scheduled tasks

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Database**: PostgreSQL with [node-postgres (pg)](https://node-postgres.com/)
- **Maps**: [Leaflet](https://leafletjs.com/) with React Leaflet
- **Charts**: [Recharts](https://recharts.org/)
- **Forms**: React Hook Form with Zod validation
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm/yarn/pnpm/bun**: Package manager of your choice
- **PostgreSQL**: Database server (local or remote)

## ⚙️ Environment Setup

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repository-url>
   cd leezencounter/webapplication
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and configure the following variables:

   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/leezencounter"

   # Application URL
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"

   # TTN (The Things Network) Configuration
   # API URL for The Things Network integration
   TTN_API_URL="https://your-ttn-api-url.com"

   # API Key for authenticating with The Things Network
   TTN_API_KEY="your-ttn-api-key-here"
   ```

4. **Database Setup**:

   Create a PostgreSQL database and run the setup script:

   ```bash
   # Connect to your PostgreSQL instance and create the database
   createdb leezencounter

   # Run the database schema
   psql -d leezencounter -f database/setup_database.sql
   ```

## 🚀 Getting Started

1. **Start the development server**:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

2. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

3. **Explore the application**:
   - **Dashboard** (`/dashboard`): View analytics and charts
   - **Leezenboxes** (`/leezenboxes`): Manage sensor devices
   - **Map** (`/map`): Interactive map view of all sensors
   - **Settings** (`/settings`): Application configuration

## 📂 Project Structure

```
webapplication/
├── app/                      # Next.js App Router
│   ├── (frontend)/          # Frontend routes
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── leezenboxes/     # Leezenbox management
│   │   ├── map/             # Map visualization
│   │   └── settings/        # Settings pages
│   └── api/                 # API routes
│       ├── cron/            # Scheduled tasks
│       ├── leezenbox/       # Leezenbox CRUD operations
│       └── ttn-data/        # TTN data endpoints
├── components/              # Reusable UI components
├── actions/                 # Server actions
├── database/                # Database schemas and migrations
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions
├── public/                  # Static assets
└── types.ts                 # TypeScript type definitions
```

## 📊 API Endpoints

The application provides several API endpoints:

- `GET /api/leezenbox` - Retrieve all Leezenboxes
- `POST /api/leezenbox` - Create a new Leezenbox
- `GET /api/leezenbox/[id]` - Get specific Leezenbox data
- `POST /api/ttn-data` - Receive TTN sensor data
- `GET /api/cron` - Scheduled data processing

## 🏗️ Build and Deployment

### Production Build

```bash
npm run build
npm run start
```

### Deployment on Vercel

This application is optimized for deployment on [Vercel](https://vercel.com/):

1. **Connect your repository** to Vercel
2. **Set environment variables** in the Vercel dashboard:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_BASE_URL`
3. **Deploy** - Vercel will automatically build and deploy your application

The `vercel.json` file includes configuration for scheduled cron jobs.

### Other Deployment Options

The application can be deployed on any platform that supports Node.js:

- **Docker**: Create a Dockerfile for containerized deployment
- **Railway**: Connect your GitHub repository
- **Heroku**: Use the Heroku CLI or GitHub integration
- **DigitalOcean App Platform**: Deploy directly from GitHub

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**:

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env.local`
- Verify database exists and is accessible

**Build Errors**:

- Clear Next.js cache: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

**Development Server Issues**:

- Check if port 3000 is already in use
- Try a different port: `npm run dev -- -p 3001`

### Getting Help

- Check the [Next.js Documentation](https://nextjs.org/docs)
- Review [React Documentation](https://react.dev/)
- Consult [Tailwind CSS Documentation](https://tailwindcss.com/docs)
