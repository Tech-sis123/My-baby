# My Baby 👶 — Maternal & Child Health Companion

A modern web application for tracking pregnancy and baby health with AI-powered insights and secure doctor-patient collaboration.

## Features

### For Mothers 👩
- 📊 **Daily Health Tracking** — Log symptoms, mood, vital signs, and health metrics
- 💬 **AI Health Assistant** — Get instant, evidence-based answers to health questions
- 🚨 **Smart Alerts** — Automatic flagging of concerning symptoms based on medical rules
- 👨‍⚕️ **Doctor Connection** — Securely share data with healthcare providers
- 📅 **Appointment Management** — Schedule and manage medical appointments
- 📋 **Pre-visit Briefs** — Printable summaries for doctor appointments

### For Doctors 👨‍⚕️
- 📈 **Real-time Dashboard** — Monitor all linked patients with live updates
- 🚩 **Flagged Concerns** — Priority alerts for patients with concerning symptoms
- 📊 **Patient History** — Complete check-in history and health trends
- 🔗 **Patient Linking** — Invite mothers to share health data via invite codes
- 📱 **Mobile Access** — View patient data on any device

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Groq API key for AI features ([console.groq.com](https://console.groq.com))

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd my-baby
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env.local
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GROQ_API_KEY=gsk_...
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

The app includes Supabase database migrations. After setting up Supabase:

1. Create a Supabase project
2. Run migrations (or use the seed script for sample data)
3. Set up Row Level Security (RLS) policies if needed

### Seed Sample Data

Populate the database with test users and data:

```bash
npm run seed
```

This creates:
- 2 mother accounts
- 2 doctor accounts
- Sample pregnancies and babies
- Sample check-ins and appointments

**Test Credentials** (after seeding):
- Mother: `mother1@example.com` / `TestPassword@123`
- Doctor: `doctor1@example.com` / `TestPassword@123`

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication layout group
│   │   ├── login/
│   │   └── signup/
│   ├── api/
│   │   ├── chat/            # AI chat API (Groq streaming)
│   │   ├── checkin/         # Health check-in submission
│   │   └── pregnancy-week/  # Gestational week calculator
│   ├── doctor/              # Doctor routes
│   │   ├── dashboard/       # Patient monitoring dashboard
│   │   ├── patient/         # Patient detail view
│   │   └── settings/        # Doctor invite codes
│   ├── mother/              # Mother routes
│   │   ├── home/            # Main dashboard
│   │   ├── ask/             # AI assistant chat
│   │   ├── appointments/    # Appointment management
│   │   ├── checkin/         # Health forms
│   │   ├── brief/           # Pre-visit briefs
│   │   ├── delivery/        # Delivery tracking
│   │   └── onboarding/      # Initial setup
│   ├── globals.css          # Tailwind styles & design tokens
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── textarea.tsx
│   └── medical-footer.tsx   # Medical disclaimer footer
├── lib/
│   ├── rules.ts             # Medical rules engine
│   ├── tips.ts              # Pregnancy & baby tips
│   ├── utils.ts             # Utility functions
│   └── supabase/
│       ├── client.ts        # Browser Supabase client
│       ├── server.ts        # Server Supabase client
│       └── types.ts         # Database types
├── middleware.ts            # Auth middleware
└── hooks/                   # Custom React hooks
```

## Key Features Explained

### Medical Rules Engine
The app includes a deterministic rules engine that evaluates check-ins and flags concerning symptoms:

**Pregnancy Rules:**
- Bleeding/spotting detection
- Preeclampsia symptoms (BP, proteinuria)
- Reduced fetal movement
- Sustained low mood screening

**Child Rules:**
- High fever in newborns
- Breathing/feeding issues
- Inadequate diaper output
- Developmental concerns

### AI Health Assistant
Uses Groq's Mixtral model for streaming responses:
- Evidence-based health guidance
- Personalized to pregnancy/child context
- Always encourages professional consultation

### Real-time Doctor Dashboard
- Live flag updates via Supabase Realtime
- Patient prioritization by alert severity
- Full check-in history with trends

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Create production build
npm start         # Run production server
npm run lint      # Lint code with ESLint
npm run seed      # Populate database with sample data
```

## Technology Stack

- **Framework**: Next.js 16.2 (React 19)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with SSR
- **UI**: Radix UI + Tailwind CSS v4
- **AI**: Groq SDK (Mixtral model)
- **Styling**: CSS variables + Tailwind
- **Icons**: Lucide React
- **Type Safety**: TypeScript

## Deployment

### Quick Deploy to Vercel

1. **Push to GitHub**
```bash
git push origin main
```

2. **Import in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Add environment variables
   - Deploy!

For detailed deployment instructions, see [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md).

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
GROQ_API_KEY=<your-groq-api-key>
```

## API Routes

### Chat API
```
POST /api/chat
Body: { messages: Array<{ role: "user" | "assistant", content: string }> }
Response: Server-Sent Event stream
```

### Check-in API
```
POST /api/checkin
Body: {
  subject_type: "pregnancy" | "child",
  subject_id: "uuid",
  payload: { ...health_metrics }
}
Response: { flags: FlagResult[] }
```

### Pregnancy Week API
```
GET /api/pregnancy-week?id=<pregnancy-id>
Response: { week: number }
```

## Authentication Flow

1. **Sign Up**: Create account as mother or doctor
2. **Middleware Protection**: Protect routes, redirect to login
3. **Doctor Linking**: Mothers use invite codes to connect with doctors
4. **Session Management**: SSR-compatible cookie-based sessions

## Medical Disclaimer

This app is a **diagnostic and monitoring tool**, not medical advice. Users should:
- Always consult healthcare providers for serious concerns
- Treat AI responses as supplementary information
- Seek immediate emergency care for life-threatening symptoms

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

[Specify your license here]

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the [Troubleshooting Guide](VERCEL_DEPLOY.md#troubleshooting)

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [Supabase](https://supabase.com)
- AI by [Groq](https://groq.com)
- UI by [Radix UI](https://radix-ui.com)

---

**My Baby** — Empowering maternal and child health care. 💚

