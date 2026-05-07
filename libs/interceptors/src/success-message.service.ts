import { Injectable } from '@nestjs/common';

/**
 * Service that maps HTTP method + route patterns to success message keys
 * This makes it easy to add new API endpoints by simply adding entries to the routeMap
 */
@Injectable()
export class SuccessMessageService {
  /**
   * Route-to-message-key mapping
   * Format: 'METHOD:/path' => 'MESSAGE_KEY'
   * Supports exact matches and pattern matching for dynamic routes
   */
  private readonly routeMap: Record<string, string> = {
    // User routes
    'POST:/register': 'USER_REGISTERED',
    'GET:/': 'USERS_RETRIEVED',
    'GET:/users': 'USERS_RETRIEVED',
    'POST:/': 'USER_CREATED',
    'POST:/users': 'USER_CREATED',
    'PATCH:/profile/me': 'PROFILE_UPDATED',
    'POST:/profile/me/change-password': 'PASSWORD_CHANGED',
    'GET:/profile/me': 'PROFILE_RETRIEVED',

    // Password reset routes
    'POST:/reset-password/request': 'PASSWORD_RESET_EMAIL_SENT',
    'POST:/reset-password/confirm': 'PASSWORD_CHANGED',

    // Auth routes
    'POST:/login': 'LOGIN_SUCCESS',
    'POST:/logout': 'LOGOUT_SUCCESS',
    'POST:/refresh': 'TOKEN_REFRESHED',
    'POST:/validate': 'TOKEN_VALIDATED',
    'POST:/assign-city-admin': 'CITY_ADMIN_ASSIGNED',
    'GET:/cities': 'USER_CITIES_RETRIEVED',
    'GET:/sessions': 'SESSIONS_RETRIEVED',
    'POST:/sessions/revoke-all': 'ALL_SESSIONS_REVOKED',
    'POST:/guest': 'GUEST_LOGIN_SUCCESS',
    'POST:/guest/register': 'GUEST_CONVERTED',
    'POST:/auth/guest': 'GUEST_LOGIN_SUCCESS',
    'POST:/auth/guest/register': 'GUEST_CONVERTED',

    // Verification routes
    'POST:/verification/send': 'EMAIL_VERIFICATION_SENT',
    'GET:/verification/verify': 'EMAIL_VERIFIED',
    'POST:/verification/verify': 'EMAIL_VERIFIED',
    'POST:/verification/resend': 'EMAIL_VERIFICATION_RESENT',
    'GET:/verification/cancel': 'VERIFICATION_CANCELLED',
    'POST:/verification/cancel': 'VERIFICATION_CANCELLED',

    // Tiles routes
    'GET:/tiles': 'TILES_RETRIEVED',
    'GET:/tiles/slug/:slug': 'TILE_RETRIEVED',
    'GET:/tiles/:id': 'TILE_RETRIEVED',
    'POST:/tiles': 'TILE_CREATED',
    'PATCH:/tiles/:id': 'TILE_UPDATED',
    'DELETE:/tiles/:id': 'TILE_DELETED',
    'POST:/tiles/:id/background-image': 'TILE_BACKGROUND_IMAGE_UPLOADED',
    'POST:/tiles/:id/icon-image': 'TILE_ICON_IMAGE_UPLOADED',

    // Tags routes
    'GET:/tags': 'TAGS_RETRIEVED',
    'GET:/tags/:id': 'TAG_RETRIEVED',
    'POST:/tags': 'TAG_CREATED',
    'DELETE:/tags/:id': 'TAG_DELETED',

    // Listings routes
    'GET:/listings': 'LISTINGS_RETRIEVED',
    'GET:/listings/slug/:slug': 'LISTING_RETRIEVED',
    'GET:/listings/:id': 'LISTING_RETRIEVED',
    'POST:/listings': 'LISTING_CREATED',
    'PATCH:/listings/:id': 'LISTING_UPDATED',
    'POST:/listings/:id/submit': 'LISTING_SUBMITTED',
    'POST:/listings/:id/moderate': 'LISTING_MODERATED',
    'POST:/listings/:id/approve': 'LISTING_APPROVED',
    'POST:/listings/:id/request-changes': 'LISTING_CHANGES_REQUESTED',
    'POST:/listings/:id/reject': 'LISTING_REJECTED',
    'POST:/listings/:id/archive': 'LISTING_ARCHIVED',
    'POST:/listings/:id/hero-image': 'LISTING_HERO_IMAGE_UPLOADED',
    'DELETE:/listings/:id/hero-image': 'LISTING_HERO_IMAGE_DELETED',
    'POST:/listings/:id/media': 'LISTING_MEDIA_UPLOADED',
    'DELETE:/listings/:id/media': 'LISTING_MEDIA_BULK_DELETED',
    'DELETE:/listings/:id/media/:mediaId': 'LISTING_MEDIA_DELETED',
    'POST:/listings/favorites': 'LISTING_FAVORITE_ADDED',
    'DELETE:/listings/favorites/:listingId': 'LISTING_FAVORITE_REMOVED',

    // Category routes
    'GET:/categories': 'CATEGORIES_RETRIEVED',
    'GET:/categories/main': 'MAIN_CATEGORIES_RETRIEVED',
    'GET:/categories/:id': 'CATEGORY_RETRIEVED',
    'POST:/categories': 'CATEGORY_CREATED',
    'PATCH:/categories/:id': 'CATEGORY_UPDATED',
    'DELETE:/categories/:id': 'CATEGORY_DELETED',
    'POST:/categories/:id/image': 'CATEGORY_IMAGE_UPLOADED',
    'DELETE:/categories/:id/image': 'CATEGORY_IMAGE_DELETED',
    'POST:/categories/:id/icon': 'CATEGORY_ICON_UPLOADED',
    'DELETE:/categories/:id/icon': 'CATEGORY_ICON_DELETED',
    'GET:/categories/cities/:cityId': 'CITY_CATEGORIES_RETRIEVED',
    'GET:/categories/cities/:cityId/with-filters': 'CITY_CATEGORIES_RETRIEVED',
    'POST:/categories/cities/:cityId/assign': 'CATEGORY_ASSIGNED_TO_CITY',
    'DELETE:/categories/cities/:cityId/categories/:categoryId': 'CATEGORY_REMOVED_FROM_CITY',
    'PATCH:/categories/cities/:cityId/categories/:categoryId': 'CITY_CATEGORY_UPDATED',
    'POST:/categories/cities/:cityId/categories/:categoryId/image': 'CITY_CATEGORY_IMAGE_UPLOADED',
    'DELETE:/categories/cities/:cityId/categories/:categoryId/image': 'CITY_CATEGORY_IMAGE_DELETED',
    'POST:/categories/cities/:cityId/categories/:categoryId/icon': 'CITY_CATEGORY_ICON_UPLOADED',
    'DELETE:/categories/cities/:cityId/categories/:categoryId/icon': 'CITY_CATEGORY_ICON_DELETED',
    'POST:/categories/cities/:cityId/requests': 'CATEGORY_REQUEST_CREATED',
    'GET:/categories/requests': 'CATEGORY_REQUESTS_RETRIEVED',
    'GET:/categories/cities/:cityId/requests': 'CATEGORY_REQUESTS_RETRIEVED',
    'POST:/categories/requests/:requestId/resolve': 'CATEGORY_REQUEST_RESOLVED',

    // City routes - handled by pattern matching below
    'GET:/search/nearby': 'CITIES_RETRIEVED',
  };

  /**
   * Get success message key for a given HTTP method and route path
   * @param method HTTP method (GET, POST, PATCH, DELETE, etc.)
   * @param path Route path (e.g., '/users', '/users/123', '/profile/me')
   * @param statusCode HTTP status code (used for fallback logic)
   * @returns Success message key
   */
  getMessageKey(method: string, path: string, statusCode: number): string {
    // Remove query parameters from path
    const cleanPath = path.split('?')[0];

    // Handle root GET route FIRST - before exact match
    // City service uses GET /, Users service uses GET /users
    if (method === 'GET' && cleanPath === '/') {
      return 'CITIES_RETRIEVED';
    }

    // Handle POST to root - before exact match
    if (method === 'POST' && cleanPath === '/') {
      return 'CITY_CREATED';
    }

    // Try exact match
    const exactKey = `${method}:${cleanPath}`;
    if (this.routeMap[exactKey]) {
      return this.routeMap[exactKey];
    }

    // Try pattern matching for dynamic routes
    for (const [routePattern, messageKey] of Object.entries(this.routeMap)) {
      // Split only on the first colon to separate method from path
      const colonIndex = routePattern.indexOf(':');
      if (colonIndex === -1) continue;

      const routeMethod = routePattern.substring(0, colonIndex);
      const routePath = routePattern.substring(colonIndex + 1);

      if (routeMethod === method) {
        if (this.matchesRoutePattern(cleanPath, routePath)) {
          return messageKey;
        }
      }
    }

    // Handle specific patterns for dynamic routes
    // UUID pattern - likely GET /:id, PATCH /:id, DELETE /:id
    const uuidPattern = /^\/[a-f0-9-]{36}$/i;
    if (uuidPattern.test(cleanPath)) {
      if (method === 'GET') {
        // Check if it's a city route (no /users prefix)
        if (!cleanPath.startsWith('/users')) {
          return 'CITY_RETRIEVED';
        }
        return 'USER_RETRIEVED';
      }
      if (method === 'PATCH') {
        if (!cleanPath.startsWith('/users')) {
          return 'CITY_UPDATED';
        }
        return 'USER_UPDATED';
      }
      if (method === 'DELETE') {
        if (!cleanPath.startsWith('/users')) {
          return 'CITY_DELETED';
        }
        return 'USER_DELETED';
      }
    }

    // Pattern for session revoke: /sessions/:sessionId/revoke
    if (method === 'POST' && /\/sessions\/[a-f0-9-]{36}\/revoke$/i.test(cleanPath)) {
      return 'SESSION_REVOKED';
    }

    // Pattern for user restore: /:id/restore
    if (method === 'PATCH' && /\/[a-f0-9-]{36}\/restore$/i.test(cleanPath)) {
      return 'USER_RESTORED';
    }

    // Pattern for city header image: /:id/header-image
    if (method === 'POST' && /\/[a-f0-9-]{36}\/header-image$/i.test(cleanPath)) {
      return 'CITY_HEADER_IMAGE_UPLOADED';
    }
    if (method === 'DELETE' && /\/[a-f0-9-]{36}\/header-image$/i.test(cleanPath)) {
      return 'CITY_HEADER_IMAGE_DELETED';
    }

    // Pattern for city dark logo: /:id/dark-logo
    if (method === 'POST' && /\/[a-f0-9-]{36}\/dark-logo$/i.test(cleanPath)) {
      return 'CITY_DARK_LOGO_UPLOADED';
    }
    if (method === 'DELETE' && /\/[a-f0-9-]{36}\/dark-logo$/i.test(cleanPath)) {
      return 'CITY_DARK_LOGO_DELETED';
    }

    // Pattern for city light logo: /:id/light-logo
    if (method === 'POST' && /\/[a-f0-9-]{36}\/light-logo$/i.test(cleanPath)) {
      return 'CITY_LIGHT_LOGO_UPLOADED';
    }
    if (method === 'DELETE' && /\/[a-f0-9-]{36}\/light-logo$/i.test(cleanPath)) {
      return 'CITY_LIGHT_LOGO_DELETED';
    }

    // Fallback based on status code
    if (statusCode === 201) {
      return 'OPERATION_SUCCESS';
    }

    // Default fallback
    return 'OPERATION_SUCCESS';
  }

  /**
   * Simple route pattern matching
   * Matches /users/123e4567-e89b-12d3-a456-426614174000 with /users/:id pattern
   * Currently handles UUID patterns, can be extended for other patterns
   */
  private matchesRoutePattern(path: string, pattern: string): boolean {
    // Convert pattern to regex (simple implementation)
    // Replace :id, :sessionId, etc. with UUID pattern
    const uuidPattern = '[a-f0-9-]{36}';
    const regexPattern = pattern
      .replace(/:[^/]+/g, uuidPattern)
      .replace(/\//g, '\\/')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(path);
  }

  /**
   * Add a new route mapping (useful for extending in the future)
   * @param method HTTP method
   * @param path Route path
   * @param messageKey Success message key
   */
  addRouteMapping(method: string, path: string, messageKey: string): void {
    this.routeMap[`${method}:${path}`] = messageKey;
  }
}
