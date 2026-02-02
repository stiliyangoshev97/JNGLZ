# Supabase Backend - JNGLZ.FUN

This directory contains the Supabase configuration and Edge Functions for JNGLZ.FUN's real-time chat and content moderation features.

## 📋 Overview

| Feature | Description |
|---------|-------------|
| **Real-time Chat** | Market-specific chat rooms with SIWE authentication |
| **Content Moderation** | Admin-controlled hiding of market content |
| **Rate Limiting** | 1 message per minute per wallet |
| **Holder Badges** | YES/NO position badges in chat |

## 🏗️ Project Structure

```
supabase/
├── config.toml           # Supabase CLI configuration
├── functions/
│   ├── _shared/          # Shared utilities
│   │   ├── cors.ts       # CORS headers for Edge Functions
│   │   ├── siwe.ts       # Sign-In With Ethereum verification
│   │   └── supabase.ts   # Supabase client factory
│   ├── send-message/     # Chat message sending (with rate limiting)
│   ├── delete-message/   # Admin message deletion
│   └── moderate-market/  # Admin market content moderation
├── CHANGELOG.md          # Version history
├── PROJECT_CONTEXT_SUPABASE.md  # Technical context
└── README.md             # This file
```

## 🔧 Configuration

### Supabase Project
| Item | Value |
|------|-------|
| Project Name | `jnglz-fun` |
| Project Ref | `rbizamxghqaqskvdjfrg` |
| URL | `https://rbizamxghqaqskvdjfrg.supabase.co` |
| Region | (Auto-selected) |

### Environment Variables

**Frontend (.env)**
```env
VITE_SUPABASE_URL=https://rbizamxghqaqskvdjfrg.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

**Edge Functions (Supabase Secrets)**
```bash
# Set via: supabase secrets set KEY=VALUE
ADMIN_ADDRESSES=0x4Cca77...,0xC119B9...,0x6499fe...
```

## 📊 Database Schema

### Tables

#### `chat_messages`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| market_id | text | Market identifier |
| contract_address | text | Contract address (lowercase) |
| network | text | `bnb-testnet` or `bnb-mainnet` |
| sender_address | text | Wallet address (lowercase) |
| message | text | Message content (max 500 chars) |
| created_at | timestamp | Creation time |

#### `chat_rate_limits`
| Column | Type | Description |
|--------|------|-------------|
| wallet_address | text | Primary key |
| last_message_at | timestamp | Last message timestamp |
| last_message_content | text | Last message content (for spam detection) |

#### `moderated_markets`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| market_id | text | Market identifier |
| contract_address | text | Contract address (lowercase) |
| network | text | `bnb-testnet` or `bnb-mainnet` |
| hidden_fields | text[] | Array of: `name`, `rules`, `evidence`, `image` |
| reason | text | Optional moderation reason |
| moderated_by | text | Admin wallet address |
| moderated_at | timestamp | Moderation timestamp |
| is_active | boolean | Whether moderation is active |

**Unique Constraint:** `(contract_address, network, market_id)`

### Row Level Security (RLS)

| Table | Policy | Description |
|-------|--------|-------------|
| chat_messages | SELECT | Public read access |
| chat_rate_limits | SELECT | Public read access |
| moderated_markets | SELECT | Public read access |

> **Note:** All write operations go through Edge Functions using `service_role` key to bypass RLS.

### Realtime

Enabled for `chat_messages` table to support real-time chat updates (INSERT and DELETE events).

## ⚡ Edge Functions

### `send-message`
Handles chat message sending with SIWE authentication and rate limiting.

**Endpoint:** `POST /functions/v1/send-message`

**Request:**
```json
{
  "message": "Hello!",
  "siweMessage": "...",
  "signature": "0x...",
  "address": "0x...",
  "marketId": "1",
  "contractAddress": "0x...",
  "network": "bnb-testnet"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": { /* ChatMessage object */ }
}
```

**Response (Rate Limited):**
```json
{
  "error": "Rate limited",
  "waitSeconds": 45
}
```

### `delete-message`
Admin-only endpoint to delete chat messages.

**Endpoint:** `POST /functions/v1/delete-message`

**Request:**
```json
{
  "siweMessage": "...",
  "signature": "0x...",
  "address": "0x...",
  "messageId": "uuid"
}
```

### `moderate-market`
Admin-only endpoint to hide/unhide market content.

**Endpoint:** `POST /functions/v1/moderate-market`

**Request (Hide):**
```json
{
  "siweMessage": "...",
  "signature": "0x...",
  "address": "0x...",
  "marketId": "1",
  "contractAddress": "0x...",
  "network": "bnb-testnet",
  "action": "hide",
  "hiddenFields": ["name", "image"],
  "reason": "Inappropriate content"
}
```

**Request (Unhide):**
```json
{
  "action": "unhide",
  ...
}
```

## 🔐 Authentication

### Sign-In With Ethereum (SIWE)
- Users sign a message with their wallet to authenticate
- Sessions last 24 hours (stored in localStorage)
- Signature verified on each Edge Function call

### Admin Authentication
- Admin wallets defined in `ADMIN_ADDRESSES` secret
- Same SIWE flow, but with admin-only permission checks
- Admins can delete messages and moderate market content

## 🚀 Deployment

### Prerequisites
1. Install Supabase CLI: `brew install supabase/tap/supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref rbizamxghqaqskvdjfrg`

### Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy send-message --no-verify-jwt
supabase functions deploy delete-message --no-verify-jwt
supabase functions deploy moderate-market --no-verify-jwt

# Set secrets
supabase secrets set ADMIN_ADDRESSES="0x4Cca77...,0xC119B9...,0x6499fe..."
```

### Database Migrations
Run these SQL commands in the Supabase Dashboard SQL Editor:

```sql
-- See PROJECT_CONTEXT_SUPABASE.md for full schema SQL
```

## 🧪 Testing

### Test Chat
1. Connect wallet on frontend
2. Navigate to a market's CHAT tab
3. Sign SIWE message when prompted
4. Send a message
5. Try sending another within 60s (should show rate limit)

### Test Admin Moderation
1. Connect with an admin wallet
2. Click "⚙️ MODERATE" button in market header
3. Toggle fields to hide/unhide
4. In chat, click trash icon on any message to delete

## 📝 Notes

- Single Supabase project used for both testnet and mainnet (distinguished by `network` column)
- Rate limit is 1 message per 60 seconds per wallet (global, not per-market)
- Hidden content shows `[Content Hidden]` text replacement
- Deleted messages are permanently removed (not soft-deleted)
