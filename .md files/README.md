# Lead Management System

A modern, real-time lead management application built with Next.js, Supabase, and Role-Based Access Control (RBAC).

## Features

- **Authentication & Authorization**: Secure login with role-based access control
- **RBAC System**: Four user roles with different permission levels
  - **Admin**: Full access to all features, user management, and role assignment
  - **Manager**: Can view, create, update, and delete leads; assign leads to sales reps
  - **Sales Rep**: Can view and update assigned leads
  - **Viewer**: Read-only access to all leads
- **Real-time Updates**: Live data synchronization using Supabase subscriptions
- **Advanced Filtering**: Filter leads by status, category, region, and more
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand + TanStack Query
- **UI Components**: Radix UI + Tailwind CSS
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rdsdd2021/LeadsManagement.git
cd LeadsManagement
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Run the database migrations:

Execute the SQL migration file in your Supabase SQL editor:
- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Copy and run the contents of `supabase/migrations/001_rbac_setup.sql`

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication

### Login

Navigate to `/login` to access the login page. Use your Supabase credentials to sign in.

**Default Admin Credentials:**
- Email: `rds2197@gmail.com`
- Password: `B@ssDr0p`

After successful login, you'll be redirected to the dashboard where you can see:
- Your email and role badge in the header
- Full access to leads management
- Real-time data updates
- Advanced filtering options

### User Roles

The system supports four roles with hierarchical permissions:

| Role | Permissions |
|------|-------------|
| Admin | Full system access, user management, role assignment |
| Manager | View, create, update, delete leads; assign leads |
| Sales Rep | View and update assigned leads only |
| Viewer | Read-only access to all leads |

### Setting User Roles

To set a user's role, you can either:

1. **During signup**: Add role to user metadata
2. **After signup**: Update the `users` table directly in Supabase
3. **Via Admin panel**: (Coming soon)

Example SQL to set a user as admin:
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

## Project Structure

```
LeadsManagement/
├── app/
│   ├── login/              # Login page
│   ├── page.tsx            # Main dashboard
│   ├── layout.tsx          # Root layout
│   └── providers.tsx       # Context providers
├── components/
│   ├── auth/               # Auth-related components
│   ├── filters/            # Filter components
│   ├── layout/             # Layout components (Header, etc.)
│   └── ui/                 # Reusable UI components
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── hooks/                  # Custom React hooks
├── lib/
│   ├── auth.ts            # Authentication utilities
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Utility functions
├── stores/                 # Zustand stores
├── supabase/
│   └── migrations/        # Database migrations
└── middleware.ts          # Route protection middleware
```

## Database Schema

### Users Table
- `id`: UUID (references auth.users)
- `email`: Text
- `role`: Enum (admin, manager, sales_rep, viewer)
- `full_name`: Text
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Leads Table
- Standard lead fields (name, status, category, etc.)
- `owner_id`: UUID (references users)
- `assigned_to`: UUID (references users)

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based policies for data access
- Protected routes with middleware
- Secure authentication with Supabase Auth

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
