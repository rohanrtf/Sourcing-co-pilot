# AI-Powered Sourcing Copilot

A production-grade SaaS web application for AI-powered sourcing and procurement management in the steel industry.

## Features

- **Indent Management**: Upload indents via PDF, Excel, or text input with AI-powered extraction
- **AI Item Normalization**: Automatic categorization and attribute extraction (Bearings specialty)
- **Vendor Management**: Complete CRUD for vendor database with category support
- **RFQ Workflow**: Generate and track RFQs with email preview (mock mode)
- **Quote Management**: Upload and parse vendor quotes with AI matching
- **Comparison Engine**: Side-by-side vendor comparison with landed cost calculation
- **Decision Workflow**: Approve selections with role-based access control
- **Excel Export**: Download comparison reports with recommendations

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) + TypeScript/JavaScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: JWT + bcrypt
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS + shadcn/ui
- **File Parsing**: xlsx, pdf-parse

## Prerequisites

- Node.js 18+
- Supabase account (for PostgreSQL + Storage)
- Yarn package manager

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# PostgreSQL - Supabase Transaction Pooler (IMPORTANT: use port 6543)
DATABASE_URL="postgresql://postgres.your-project:your-password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"

# JWT Secret
JWT_SECRET=your-secure-jwt-secret-min-32-characters

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Getting Supabase Credentials

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** for `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Go to **Settings → Database** or click **Connect** for `DATABASE_URL`
   - **IMPORTANT**: Use **Transaction Pooler** (port 6543), NOT Direct Connection
4. Create a storage bucket named `uploads` with public access

## Installation

```bash
# Install dependencies
yarn install

# Generate Prisma client
npx prisma generate

# Push database schema (or use migrations)
npx prisma db push

# Start development server
yarn dev
```

## Database Setup

### Option 1: Using Prisma Push (Quick Setup)
```bash
npx prisma db push
```

### Option 2: Using Migrations (Production)
```bash
# Create migration
npx prisma migrate dev --name init

# Apply in production
npx prisma migrate deploy
```

### Note on Supabase + Vercel
For Vercel deployment with Supabase:
- Always use **Transaction Pooler** connection string (port 6543)
- Include `?pgbouncer=true` in the connection URL
- This prevents connection pool exhaustion in serverless environments

## Deployment on Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/sourcing-copilot.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Import repository at [vercel.com/new](https://vercel.com/new)
2. Add environment variables:
   - `DATABASE_URL` (Transaction Pooler URL)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_BASE_URL` (your Vercel URL)
3. Deploy

### 3. Post-Deployment
- Ensure Supabase storage bucket `uploads` exists
- Run `npx prisma migrate deploy` if using migrations

## Project Structure

```
├── app/
│   ├── api/[[...path]]/route.js    # All API endpoints
│   ├── dashboard/                   # Dashboard pages
│   │   ├── page.js                 # Main dashboard
│   │   ├── indents/                # Indent management
│   │   ├── vendors/                # Vendor management
│   │   ├── rfqs/                   # RFQ management
│   │   └── comparison/             # Quote comparison
│   ├── layout.js                   # Root layout
│   ├── page.js                     # Landing/Auth page
│   └── globals.css                 # Global styles
├── lib/
│   ├── prisma.js                   # Prisma client
│   ├── supabase.js                 # Supabase client
│   ├── services/
│   │   ├── aiService.js            # AI extraction (MOCK)
│   │   ├── authService.js          # Authentication
│   │   ├── emailService.js         # Email (MOCK)
│   │   ├── exportService.js        # Excel export
│   │   └── storageService.js       # File storage
│   └── utils/
│       └── fileParser.js           # PDF/Excel parsing
├── prisma/
│   └── schema.prisma               # Database schema
├── components/ui/                   # shadcn components
├── .env.example                    # Environment template
├── next.config.js                  # Next.js config
├── package.json                    # Dependencies
└── README.md                       # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register company + admin user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user info

### Indents
- `GET /api/indents` - List indents
- `POST /api/indents` - Create indent (text input)
- `POST /api/indents/upload` - Create indent (file upload)
- `GET /api/indents/:id` - Get indent details
- `PUT /api/indents/:id` - Update indent
- `DELETE /api/indents/:id` - Delete indent
- `POST /api/indents/:id/normalize` - AI normalize items
- `POST /api/indents/:id/upload` - Upload file to indent
- `GET /api/indents/:id/comparison` - Get comparison data
- `GET /api/indents/:id/export` - Download Excel report

### Vendors
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `GET /api/vendors/:id` - Get vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### RFQs
- `GET /api/rfqs` - List RFQs
- `POST /api/rfqs` - Create RFQ
- `GET /api/rfqs/:id` - Get RFQ details
- `PUT /api/rfqs/:id` - Update RFQ
- `GET /api/rfqs/:id/email/:vendorId` - Preview email
- `POST /api/rfqs/:id/send` - Send RFQ (mock)

### Quotes
- `GET /api/quotes` - List quotes
- `POST /api/quotes` - Create quote (text)
- `POST /api/quotes/upload` - Create quote (file)
- `GET /api/quotes/:id` - Get quote details
- `POST /api/quotes/:id/match` - Match to indent lines

### Decisions
- `POST /api/decisions` - Approve decisions
- `GET /api/indents/:id/decisions` - Get indent decisions

## User Roles

| Role | Permissions |
|------|-------------|
| ADMIN | Full access + user management |
| MANAGER | Create RFQ, approve decisions |
| EXECUTIVE | Create indent, upload quotes (no approve) |

## AI Service (Mock)

The AI service is implemented with mock logic for MVP:
- `extractIndentLines()` - Parse text to line items
- `normalizeItem()` - Categorize and extract attributes (Bearings specialty)
- `parseQuote()` - Extract prices from quote text
- `matchQuoteToIndent()` - Similarity matching

To integrate OpenAI, update `/lib/services/aiService.js` with actual API calls.

## License

MIT
