# 📋 JNGLZ.FUN - Supabase Project Context

> Quick reference for AI assistants and developers.  
> **Last Updated:** February 2, 2026  
> **Version:** 1.1.0  
> **Status:** Chat + Moderation Complete

---

## 🎯 Overview

Supabase backend for JNGLZ.FUN providing:
- **Real-time Chat** - Market-specific chat rooms
- **Content Moderation** - Admin-controlled content hiding
- **SIWE Authentication** - Sign-In With Ethereum for write operations
- **Rate Limiting** - Spam prevention (1 msg/min)

---

## 🔧 Configuration

### Supabase Project
| Item | Value |
|------|-------|
| Project Name | `jnglz-fun` |
| Project Ref | `rbizamxghqaqskvdjfrg` |
| URL | `https://rbizamxghqaqskvdjfrg.supabase.co` |
| Anon Key | `sb_publishable_dyK8V558JclvZ4MWVV44Pw_MpGaNN18` |

### Environment Variables

**Frontend `.env`:**
```env
VITE_SUPABASE_URL=https://rbizamxghqaqskvdjfrg.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**Edge Function Secrets (via `supabase secrets set`):**
```
ADMIN_ADDRESSES=0x4Cca77ba15B0D85d7B733E0838a429E7bEF42DD2,0xC119B9152afcC5f40C019aABd78A312d37C63926,0x6499fe8016cE2C2d3a21d08c3016345Edf3467F1
```

---

## 📊 Database Schema

### Tables

#### `chat_messages`
```sql
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,        -- lowercase
  network TEXT NOT NULL,                  -- 'bnb-testnet' | 'bnb-mainnet'
  sender_address TEXT NOT NULL,           -- lowercase
  message TEXT NOT NULL,                  -- max 500 chars
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `chat_rate_limits`
```sql
CREATE TABLE chat_rate_limits (
  wallet_address TEXT PRIMARY KEY,
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `moderated_markets`
```sql
CREATE TABLE moderated_markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL,
  hidden_fields TEXT[] NOT NULL,          -- ['name', 'rules', 'evidence', 'image']
  reason TEXT,
  moderated_by TEXT NOT NULL,
  moderated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(contract_address, network, market_id)
);
```

### Row Level Security

| Table | SELECT | INSERT/UPDATE/DELETE |
|-------|--------|---------------------|
| chat_messages | ✅ Public | ❌ Via Edge Functions only |
| chat_rate_limits | ✅ Public | ❌ Via Edge Functions only |
| moderated_markets | ✅ Public | ❌ Via Edge Functions only |

### Realtime

- `chat_messages` - INSERT and DELETE events enabled
- Used for real-time chat updates and message deletion sync

---

## ⚡ Edge Functions

### Directory Structure
```
functions/
├── _shared/
│   ├── cors.ts          # CORS headers
│   ├── siwe.ts          # SIWE signature verification
│   └── supabase.ts      # Client factories
├── send-message/
│   └── index.ts         # POST /functions/v1/send-message
├── delete-message/
│   └── index.ts         # POST /functions/v1/delete-message
└── moderate-market/
    └── index.ts         # POST /functions/v1/moderate-market
```

### `send-message`

**Purpose:** Send chat message with SIWE auth + rate limiting

**Request:**
```typescript
{
  message: string           // 1-500 chars
  siweMessage: string       // SIWE message that was signed
  signature: string         // Wallet signature
  address: string           // Wallet address
  marketId: string          // Market ID
  contractAddress: string   // Contract address
  network: 'bnb-testnet' | 'bnb-mainnet'
}
```

**Response:**
```typescript
// Success
{ success: true, message: ChatMessage }

// Rate Limited
{ error: "Rate limited", waitSeconds: number }

// Error
{ error: string }
```

### `delete-message`

**Purpose:** Delete chat message (admin only)

**Request:**
```typescript
{
  siweMessage: string
  signature: string
  address: string           // Must be in ADMIN_ADDRESSES
  messageId: string         // UUID of message to delete
}
```

**Response:**
```typescript
{ success: true }
// or
{ error: string }
```

### `moderate-market`

**Purpose:** Hide/unhide market content (admin only)

**Request:**
```typescript
{
  siweMessage: string
  signature: string
  address: string           // Must be in ADMIN_ADDRESSES
  marketId: string
  contractAddress: string
  network: 'bnb-testnet' | 'bnb-mainnet'
  action: 'hide' | 'unhide'
  hiddenFields?: ('name' | 'rules' | 'evidence' | 'image')[]  // Required for 'hide'
  reason?: string           // Optional
}
```

---

## 🔐 Authentication

### SIWE Flow
1. User connects wallet
2. Frontend generates SIWE message
3. User signs message with wallet
4. Signature + message sent with each Edge Function request
5. Edge Function verifies signature using viem
6. Session stored in localStorage (24h TTL)

### Admin Authentication
- Same SIWE flow
- Edge Functions check if `address.toLowerCase()` is in `ADMIN_ADDRESSES` secret
- Admin-only endpoints: `delete-message`, `moderate-market`

---

## 🖥️ Frontend Integration

### Files Created
```
src/
├── lib/
│   ├── supabase.ts              # Supabase client singleton
│   └── database.types.ts        # TypeScript types for DB
├── shared/hooks/
│   └── useSIWE.ts               # SIWE hook (sign, verify, session)
└── features/chat/
    ├── api/
    │   ├── chat.api.ts          # fetchMessages, sendMessage, deleteMessage, subscribe
    │   └── moderation.api.ts    # fetchModeration, moderateMarket
    ├── hooks/
    │   └── useChat.ts           # Chat state management
    ├── components/
    │   ├── ChatTab.tsx          # Main chat component
    │   ├── ChatMessage.tsx      # Message with holder badge + delete
    │   ├── ChatInput.tsx        # Input with SIWE auth flow
    │   └── ModerationModal.tsx  # Admin moderation UI
    └── index.ts                 # Feature exports
```

### Integration Points
- **MarketDetailPage** - CHAT tab in TradesAndHoldersTabs
- **MarketDetailPage** - "⚙️ MODERATE" button (admin only)
- **ChatMessage** - Delete button (admin only)

---

## 🚀 Deployment Commands

```bash
# Install CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link project
cd frontend
supabase link --project-ref rbizamxghqaqskvdjfrg

# Deploy functions
supabase functions deploy send-message --no-verify-jwt
supabase functions deploy delete-message --no-verify-jwt
supabase functions deploy moderate-market --no-verify-jwt

# Set secrets
supabase secrets set ADMIN_ADDRESSES="0x4Cca77...,0xC119B9...,0x6499fe..."

# View logs
supabase functions logs send-message
```

---

## 📝 Key Design Decisions

1. **Single Project for Testnet/Mainnet** - Differentiated by `network` column
2. **Edge Functions for Writes** - RLS blocks direct writes, service_role bypasses
3. **Hard Delete for Messages** - Admin deletions are permanent (no audit trail)
4. **Soft Delete for Moderation** - `is_active` boolean allows unhide
5. **Global Rate Limit** - Per wallet, not per market (simpler, prevents spam)
6. **SIWE Sessions** - 24h TTL, stored in localStorage

---

## 🐛 Known Issues / TODOs

- [ ] Apply hidden content display in MarketDetailPage (frontend pending)
- [ ] Apply hidden content in market list cards (frontend pending)
- [ ] Consider adding message edit functionality (currently no editing)
- [ ] Consider soft-delete for messages with audit trail

---

## 📚 Related Documentation

- [Frontend PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md)
- [Frontend CHANGELOG.md](../CHANGELOG.md)
- [Supabase Docs](https://supabase.com/docs)
- [SIWE Spec](https://eips.ethereum.org/EIPS/eip-4361)
