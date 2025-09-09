-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_source_type ON recipes(source_type);
CREATE INDEX IF NOT EXISTS idx_recipes_source_url ON recipes(source_url);

-- Add GIN index for JSONB extracted column for faster tag/ingredient searches
CREATE INDEX IF NOT EXISTS idx_recipes_extracted_gin ON recipes USING GIN (extracted);
