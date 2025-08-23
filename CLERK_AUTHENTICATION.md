# Clerk Authentication Setup for CarbonTwin

## Overview

This project now includes Clerk authentication to secure access to the CarbonTwin platform. Users must sign in to access the dashboard and other features.

## Setup Instructions

### 1. Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

### 2. Get Your Clerk Keys

1. In your Clerk dashboard, go to **Developers** → **API Keys**
2. Copy your **Publishable Key**
3. Update the `.env.local` file in the frontend directory:

```env
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your-actual-key-here
```

### 3. Configure Authentication Settings (Optional)

In your Clerk dashboard, you can customize:

- **User Management** → **Email, Phone, Username** settings
- **User Management** → **Authentication** → Social providers (Google, GitHub, etc.)
- **User Management** → **Authentication** → Multi-factor authentication
- **Customization** → **Appearance** to match your brand

### 4. Run the Application

```bash
cd frontend
npm start
```

## Features Implemented

### Authentication Flow

- **Sign In**: Users are redirected to sign-in page when not authenticated
- **Sign Up**: New users can create accounts
- **Sign Out**: Handled through Clerk's UserButton component
- **Protected Routes**: All main application routes require authentication

### UI Components

- **UserButton**: Displays user avatar and handles profile/logout actions
- **User Greeting**: Shows "Welcome, [Name]!" in the navbar
- **Custom Styling**: Dark mode support with Tailwind CSS theming
- **Responsive Design**: Works on mobile and desktop

### Pages

- `/sign-in` - Custom sign-in page with branded styling
- `/sign-up` - Custom sign-up page with branded styling
- `/` - Main dashboard (protected)
- `/emissions` - Emissions tracker (protected)
- `/digital-twin` - Digital twin interface (protected)
- `/marketplace` - Carbon marketplace (protected)
- `/analytics` - Analytics dashboard (protected)

## Code Structure

### Key Files Modified

- `src/App.tsx` - Added ClerkProvider wrapper and authentication routing
- `src/components/Navbar.tsx` - Added UserButton and user greeting
- `src/pages/SignInPage.tsx` - Custom sign-in page
- `src/pages/SignUpPage.tsx` - Custom sign-up page
- `.env.local` - Environment variables for Clerk configuration

### Authentication State

- Uses Clerk's `useUser()` hook to access user information
- Uses Clerk's `SignedIn`/`SignedOut` components for conditional rendering
- Integrates with existing wallet functionality (wallet state is cleared on logout)

## Customization

### Styling

The authentication components use Tailwind CSS classes that match your existing design:

- Dark mode support
- Gradient buttons matching your brand colors
- Consistent spacing and typography

### User Data

Access user information in any component:

```typescript
import { useUser } from "@clerk/clerk-react";

const { user } = useUser();
// user.firstName, user.lastName, user.emailAddresses, etc.
```

### Additional Features

You can extend the authentication by:

- Adding custom user metadata
- Implementing role-based access control
- Adding organization support for team accounts
- Integrating with your backend API using Clerk session tokens

## Security Notes

- All routes except `/sign-in` and `/sign-up` are protected
- Wallet connections are automatically cleared on logout for security
- User sessions are managed securely by Clerk
- Environment variables keep your API keys secure

## Troubleshooting

### Common Issues

1. **"Missing Publishable Key" error**: Make sure your `.env.local` file has the correct Clerk publishable key
2. **Styling issues**: Ensure Tailwind CSS classes are properly configured
3. **Redirect loops**: Check that your sign-in/sign-up URLs match Clerk dashboard settings

### Development

- Use Clerk's test environment for development
- Switch to production keys when deploying
- Monitor authentication events in Clerk dashboard

## Next Steps

Consider adding:

- Email verification flows
- Password reset functionality
- Multi-factor authentication
- Social login providers (Google, GitHub, etc.)
- User profile management
- Organization/team features
