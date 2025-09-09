# Recipe Migration System

This directory contains templates and tools for migrating existing recipes to new schema structures.

## 🚨 Important: Always Backup First!

Before running any migration, **always** create a backup:

```bash
node scripts/backup-database.js
```

This creates a timestamped JSON backup of all recipes.

## 📁 Files

### Templates
- `migrate-recipes-template.js` - Template for creating migration scripts
- `migrate-api-template.ts` - Template for creating migration API endpoints

### Tools
- `../backup-database.js` - Creates database backups before migrations

### Archives
- `../migrations-archive/` - Contains completed migrations for reference

## 🔄 How to Create a New Migration

### 1. Create Migration Script

```bash
# Copy the template
cp scripts/migration-templates/migrate-recipes-template.js scripts/migrate-recipes-YYYY-MM-DD-feature.js

# Edit the new file and customize:
# - fetchRecipesToMigrate() - Define which recipes need migration
# - migrateRecipe() - Implement the migration logic
```

### 2. Create Migration API (if needed)

```bash
# Copy the API template
cp scripts/migration-templates/migrate-api-template.ts src/app/api/migrate-feature/route.ts

# Customize the API logic for your specific migration
```

### 3. Test the Migration

```bash
# Always test with dry run first
node scripts/migrate-recipes-YYYY-MM-DD-feature.js --dry-run --limit 1

# Test with a few recipes
node scripts/migrate-recipes-YYYY-MM-DD-feature.js --dry-run --limit 5

# Test specific recipe
node scripts/migrate-recipes-YYYY-MM-DD-feature.js --dry-run --id "recipe-id-here"
```

### 4. Run the Migration

```bash
# Create backup first!
node scripts/backup-database.js

# Run the migration
node scripts/migrate-recipes-YYYY-MM-DD-feature.js
```

### 5. Archive the Migration

After successful migration, move files to archive:

```bash
mkdir scripts/migrations-archive/YYYY-MM-DD-feature-migration
mv scripts/migrate-recipes-YYYY-MM-DD-feature.js scripts/migrations-archive/YYYY-MM-DD-feature-migration/
mv src/app/api/migrate-feature scripts/migrations-archive/YYYY-MM-DD-feature-migration/migrate-feature-api
```

## 📊 Previous Migrations

### 2025-01-09: Component Structure Migration
- **Goal**: Migrated recipes from single ingredients/steps to multi-component structure
- **Results**: 67/88 recipes successfully migrated, 130 components created
- **Files**: `migrations-archive/2025-01-09-component-migration/`

## 💡 Best Practices

1. **Always backup first** - Use `backup-database.js`
2. **Test thoroughly** - Use `--dry-run` and `--limit` flags
3. **Handle failures gracefully** - Some recipes may fail due to data quality
4. **Add delays** - Avoid overwhelming external APIs
5. **Log everything** - Detailed logging helps with debugging
6. **Archive completed migrations** - Keep for future reference

## 🛠 Troubleshooting

### Common Issues

1. **Unicode/Emoji errors**: Add sanitization in the migration logic
2. **Schema validation failures**: Update validation rules or handle edge cases
3. **API rate limits**: Add delays between requests
4. **Memory issues**: Process in smaller batches

### Recovery

If a migration fails partway through:

1. Check the logs for the last successful recipe
2. Use `--id` flag to resume from specific recipes
3. Restore from backup if needed:
   ```bash
   # Manual restore process (customize based on backup format)
   node scripts/restore-from-backup.js backup-recipes-YYYY-MM-DD-timestamp.json
   ```

## 📝 Adding to Package.json

Add migration scripts to `package.json`:

```json
{
  "scripts": {
    "backup": "node scripts/backup-database.js",
    "migrate:dry": "node scripts/migrate-recipes-YYYY-MM-DD-feature.js --dry-run --limit 5",
    "migrate:test": "node scripts/migrate-recipes-YYYY-MM-DD-feature.js --dry-run --limit 1",
    "migrate:run": "node scripts/migrate-recipes-YYYY-MM-DD-feature.js"
  }
}
```
