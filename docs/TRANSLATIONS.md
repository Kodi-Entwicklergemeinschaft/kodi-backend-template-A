# Translation Library Documentation

## Overview

The translation library (`@kodi/translations`) provides database-backed translations for entity content (listings, cities, categories, etc.) with automatic translation via DeepL integration. This is separate from `@kodi/i18n`, which handles static UI/notification messages stored in JSON files.

### Source Language Tracking

Each translatable entity (listing, category, tile, parking space) maintains a `languageCode` field that indicates the **source language** of the original content. This is critical for accurate DeepL translations:

- **User-created content**: The `languageCode` is automatically set from the user's device/request language (via `Accept-Language` header or i18n service)
- **Integration-created content**: The `languageCode` is set based on the integration's source language (e.g., `'de'` for Destination One/Mobilithek data)
- **Translation jobs**: When publishing translation jobs, the entity's `languageCode` is used as the `sourceLocale` parameter for DeepL, ensuring accurate translation from the correct source language

## Architecture

### Components

1. **TranslationService** - Main service interface for translation operations
2. **DatabaseProvider** - Handles storage and retrieval of translations from the database
3. **DeepLProvider** - Integrates with DeepL API for automatic translations
4. **TranslationModule** - NestJS module that wires everything together

### Database Schema

Translations are stored in the `translations` table in the core database with the following structure:

- `id` - UUID primary key
- `key` - Optional generic key (for non-entity translations)
- `entityType` - Entity type (e.g., "listing", "city", "category")
- `entityId` - Entity ID reference
- `field` - Field name (e.g., "title", "description")
- `locale` - Language code (e.g., "en", "de", "dk")
- `sourceLocale` - Original language of the text
- `value` - Translated text
- `sourceHash` - SHA-256 hash of source text (for change detection)
- `source` - Translation source (MANUAL, AUTO_DEEPL, IMPORT)
- `metadata` - JSON metadata (provider-specific info)
- `createdAt`, `updatedAt` - Timestamps

### Indexes

- Unique constraint on `(entityType, entityId, field, locale)`
- Unique constraint on `(key, locale)`
- Indexes on entity lookups and locale queries

## Configuration

Add the following environment variables:

```bash
# DeepL API Configuration
DEEPL_API_KEY=your_deepl_api_key
DEEPL_API_URL=https://api-free.deepl.com/v2/translate  # Optional, defaults to free API

# Translation Settings
TRANSLATIONS_DEFAULT_SOURCE_LOCALE=en  # Default source language
TRANSLATIONS_AUTO_TRANSLATE_ON_READ=true  # Enable on-read auto-translation
```

Configuration is automatically loaded via `@kodi/config`.

## Usage

### Basic Translation Operations

#### Get Translation for Entity Field

```typescript
import { TranslationService } from '@kodi/translations';

// Get translated title for a listing
const translatedTitle = await translationService.getTranslation(
  'listing',
  listingId,
  'title',
  'de', // target locale
  originalTitle, // optional: source text if not in default locale
  listing.languageCode, // optional: source locale (uses entity's languageCode if available)
);
```

**Note**: The `sourceLocale` parameter (6th argument) is optional. If not provided, the service uses the default source locale. However, it's recommended to pass the entity's `languageCode` when available to ensure accurate translations, especially for content from integrations (e.g., German content from Destination One).

#### Save Manual Translation

```typescript
await translationService.saveTranslation(
  'listing',
  listingId,
  'title',
  'de',
  'Willkommen in unserer Stadt',
  'en', // source locale
  sourceHash, // optional: hash of source text
  TranslationSource.MANUAL,
);
```

#### Auto-Translate Entity Field

```typescript
await translationService.autoTranslate(
  'listing',
  listingId,
  'title',
  'en', // source locale
  ['de', 'dk', 'no'], // target locales
  'Welcome to our city', // source text
  sourceHash, // optional: hash for change detection
);
```

### Automatic Translation Flow

#### On Entity Create/Update

When a listing (or other entity) is created or updated via the core service:

1. The system computes a `sourceHash` for each translatable field (title, summary, description)
2. For new entities, translation jobs are automatically published to the scheduler
3. For updates, translation jobs are only published if the `sourceHash` differs from the stored value
4. The scheduler processes these jobs asynchronously using DeepL

#### On-Read Auto-Translation

When `getTranslation` is called and no translation exists:

1. The service returns the default language text immediately
2. If `autoTranslateOnRead` is enabled, a translation job is published to the scheduler
3. Subsequent requests will see the translated content once the job completes

### Destination-One Integration

The Destination-One sync integration automatically handles translations:

- All listings and categories synced from Destination One are marked with `languageCode = 'de'` (German), as the source data is in German
- Only fields that have changed (based on `sourceHash`) trigger translation jobs
- Fields that haven't changed skip re-translation to avoid unnecessary API calls
- Translation jobs are queued asynchronously via RabbitMQ with the correct `sourceLocale = 'de'` so DeepL translates from German to target languages

### Parking Spaces (Mobilithek Integration)

Parking spaces synced from Mobilithek are also marked with `languageCode = 'de'` since the source data is in German. When translations are requested, the system uses German as the source language for DeepL translation.

### Supported Languages

The library supports the following languages (mapped to DeepL codes):

- `de` → DE (German)
- `en` → EN (English)
- `dk` → DA (Danish)
- `no` → NB (Norwegian Bokmål)
- `se` → SV (Swedish)
- `ar` → AR (Arabic)
- `fa` → FA (Persian)
- `tr` → TR (Turkish)
- `ru` → RU (Russian)
- `uk` → UK (Ukrainian)

## Scheduler Integration

Translation jobs are processed by the scheduler service:

1. Jobs are published to RabbitMQ with pattern `translation.autoTranslate`
2. The scheduler's `TranslationHandlerService` listens for these events
3. Jobs are processed asynchronously, calling `TranslationService.autoTranslate`
4. Errors are logged but don't block message acknowledgment

## Best Practices

1. **Source Hash Usage**: Always provide `sourceHash` when auto-translating to avoid re-translating unchanged content
2. **Error Handling**: Translation failures are logged but don't throw errors in async jobs
3. **Fallback Behavior**: Always have a fallback to default language text when translations are missing
4. **Batch Operations**: Use `translateBatch` for multiple texts to the same target locale
5. **Change Detection**: The system automatically skips translation if `sourceHash` matches existing translations

## Troubleshooting

### Translations Not Appearing

1. Check that DeepL API key is configured correctly
2. Verify that translation jobs are being published to RabbitMQ
3. Check scheduler logs for translation job processing errors
4. Ensure Prisma client has been regenerated after schema changes

### DeepL API Errors

- Verify API key is valid and has sufficient quota
- Check network connectivity to DeepL API
- Review DeepL API response in logs for specific error messages

### Performance Considerations

- Translation jobs are processed asynchronously to avoid blocking requests
- Source hash comparison prevents unnecessary re-translations
- Batch translation is used when possible to reduce API calls

## Migration

After adding the Translation model to the Prisma schema:

```bash
# Generate Prisma client
npx prisma generate --schema=libs/prisma/src/schemas/core/schema.prisma

# Run migration
npx prisma migrate dev --schema=libs/prisma/src/schemas/core/schema.prisma
```

## Examples

### Example: Fetching Translated Listing

```typescript
// In a listings controller/service
const listing = await prisma.listing.findUnique({ where: { id } });

// Get source language from listing (or use default)
const sourceLocale = listing.languageCode || 'en';

// Get translated title
const title = await translationService.getTranslation(
  'listing',
  listing.id,
  'title',
  userLocale,
  listing.title, // fallback to original
  sourceLocale, // pass entity's source language for accurate DeepL translation
);

// Get translated description
const description = await translationService.getTranslation(
  'listing',
  listing.id,
  'description',
  userLocale,
  listing.content, // content field maps to description in translations
  sourceLocale, // pass entity's source language
);
```

### Example: Manual Translation Update

```typescript
// Admin manually updates a translation
await translationService.saveTranslation(
  'listing',
  listingId,
  'title',
  'de',
  'Korrigierter Titel', // corrected title
  'en',
  undefined, // no sourceHash for manual edits
  TranslationSource.MANUAL,
);
```
