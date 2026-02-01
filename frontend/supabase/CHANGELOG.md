# Supabase Changelog

All notable changes to the JNGLZ.FUN Supabase backend will be documented in this file.

## [1.2.0] - 2026-02-02

### Added - Content Moderation Display

#### Frontend Moderation Display
- **MarketDetailPage**: Moderation now applied to displayed content
  - Hidden question/name shows `[Content Hidden by Moderator]`
  - Hidden rules show `[Content Hidden by Moderator]`
  - Hidden evidence link shows `[Link Hidden by Moderator]`
  - Hidden image shows placeholder with `[Image Hidden by Moderator]`
- **MarketsPage**: Market cards now respect moderation
  - Hidden market names display placeholder text
  - Hidden images show "IMAGE HIDDEN" placeholder
  - Batch moderation fetch for efficient API usage

#### New Hooks
- `useMarketModeration` - Single market moderation status
- `useMarketsModeration` - Batch moderation for market lists

#### Moderation Flow
1. Market loads → fetch moderation status from Supabase
2. If `is_active` moderation exists → check `hidden_fields` array
3. Apply `[Content Hidden]` replacement for each hidden field
4. Admin changes moderation → refetch + real-time update

---

## [1.1.0] - 2026-02-02

### Added - Admin Moderation UI Support

#### Delete Message Edge Function
- New `delete-message` Edge Function for admin message deletion
- Permanently removes messages from database (hard delete)
- Requires SIWE authentication + admin wallet verification
- Real-time deletion syncs to all connected clients via Supabase Realtime

#### Frontend Integration
- Chat messages now show delete button for admins
- ModerationModal component for hiding market content
- "⚙️ MODERATE" button in market header (admin only)

### Fixed - Rate Limit Timer
- Fixed rate limit countdown not clearing when time expires
- Removed "Rate limited." prefix text, now just shows "Wait Xs..."

---

## [1.0.0] - 2026-02-02

### Added - Initial Supabase Integration

Complete Supabase backend setup for real-time chat and content moderation.

#### Database Schema
- `chat_messages` table with RLS (SELECT only for public)
- `chat_rate_limits` table for message rate limiting
- `moderated_markets` table for content moderation
- Realtime enabled for `chat_messages`

#### Edge Functions
- `send-message` - Chat with SIWE auth + 60s rate limiting
- `moderate-market` - Admin content moderation (hide/unhide)

#### Shared Utilities
- `_shared/cors.ts` - CORS headers for Edge Functions
- `_shared/supabase.ts` - Supabase client factory (anon + service_role)
- `_shared/siwe.ts` - Sign-In With Ethereum verification using viem

#### Security Model
- Public can only SELECT from tables (RLS)
- All writes go through Edge Functions with `service_role` key
- SIWE authentication required for chat writes
- Admin actions require wallet in `ADMIN_ADDRESSES` env var

#### Features
- Real-time chat per market
- 500 character message limit
- 1 message per 60 seconds rate limit
- Holder badges (YES/NO) based on positions
- Content moderation for: name, rules, evidence link, image
- Multi-network support (testnet/mainnet in same database)

---

## Database Schema SQL

For reference, here's the complete schema:

```sql
-- Chat Messages Table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('bnb-testnet', 'bnb-mainnet')),
  sender_address TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_market 
  ON chat_messages(contract_address, network, market_id);
CREATE INDEX idx_chat_messages_created 
  ON chat_messages(created_at DESC);

-- Rate Limits Table
CREATE TABLE chat_rate_limits (
  wallet_address TEXT PRIMARY KEY,
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderated Markets Table
CREATE TABLE moderated_markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('bnb-testnet', 'bnb-mainnet')),
  hidden_fields TEXT[] NOT NULL,
  reason TEXT,
  moderated_by TEXT NOT NULL,
  moderated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(contract_address, network, market_id)
);

-- RLS Policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderated_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read chat_messages" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Public read chat_rate_limits" ON chat_rate_limits
  FOR SELECT USING (true);

CREATE POLICY "Public read moderated_markets" ON moderated_markets
  FOR SELECT USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```
