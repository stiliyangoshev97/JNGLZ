-- Migration: Add last_message_content to chat_rate_limits
-- Version: 1.3.0
-- Date: 2026-02-02
-- Description: Adds column for spam detection (comparing consecutive messages)

-- Add column for storing last message content (used for spam detection)
ALTER TABLE chat_rate_limits 
ADD COLUMN IF NOT EXISTS last_message_content TEXT;

-- Add comment for documentation
COMMENT ON COLUMN chat_rate_limits.last_message_content IS 'Last message content for spam/duplicate detection';
