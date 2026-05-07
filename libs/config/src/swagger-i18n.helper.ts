import { ConfigService } from './config.service';

/**
 * Language configuration for Swagger UI
 */
interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

/**
 * Default language options with native names
 */
const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'dk', name: 'Danish', nativeName: 'Dansk' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'se', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
];

/**
 * Get Swagger UI options with i18n language selector
 * @param configService ConfigService instance
 * @returns Swagger UI setup options
 */
export function getSwaggerI18nOptions(configService: ConfigService) {
  const defaultLanguage = configService.get<string>('i18n.defaultLanguage', 'en');
  const supportedLanguages = configService.get<string[]>('i18n.supportedLanguages') || [
    'de',
    'en',
    'dk',
    'no',
    'se',
    'ar',
    'fa',
    'tr',
    'ru',
    'uk',
  ];

  // Filter language options to only include supported languages
  const languageOptions = DEFAULT_LANGUAGES.filter((lang) =>
    supportedLanguages.includes(lang.code),
  );

  // Generate language selector HTML
  const languageOptionsHtml = languageOptions
    .map((lang) => `<option value="${lang.code}">${lang.nativeName} (${lang.name})</option>`)
    .join('');

  // Build the JavaScript code as a string to be injected via customJsStr
  // This avoids using eval() and is CSP-compliant
  const customJsStr = `
(function() {
  'use strict';

  // Language storage key - shared across all services
  var LANGUAGE_STORAGE_KEY = 'kodi-swagger-language';
  var LANGUAGE_QUERY_PARAM = 'lang';
  var DEFAULT_LANGUAGE = ${JSON.stringify(defaultLanguage)};
  var LANGUAGE_OPTIONS_HTML = ${JSON.stringify(languageOptionsHtml)};

  // Helper function to get language from URL or storage
  function getLanguage() {
    try {
      var urlParams = new URLSearchParams(window.location.search);
      var urlLang = urlParams.get(LANGUAGE_QUERY_PARAM);

      if (urlLang) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, urlLang);
        return urlLang;
      }

      return localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE;
    } catch (e) {
      return DEFAULT_LANGUAGE;
    }
  }

  // Helper function to update URL with language parameter
  function updateUrlWithLanguage(lang) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set(LANGUAGE_QUERY_PARAM, lang);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.debug('Could not update URL:', e);
    }
  }

  // Show notification when language changes
  function showLanguageChangeNotification(lang) {
    try {
      var existing = document.getElementById('swagger-i18n-notification');
      if (existing) {
        existing.remove();
      }

      var notification = document.createElement('div');
      notification.id = 'swagger-i18n-notification';
      notification.style.cssText = 'position: fixed; top: 70px; right: 10px; z-index: 101; padding: 12px 20px; background: #4caf50; color: white; border-radius: 6px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; font-weight: 500;';
      notification.textContent = 'Language changed to: ' + lang.toUpperCase() + '. Accept-Language header will be set for API requests.';

      document.body.appendChild(notification);

      setTimeout(function() {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 3000);
    } catch (e) {
      console.debug('Could not show notification:', e);
    }
  }

  // Initialize language selector
  function initLanguageSelector() {
    if (document.getElementById('swagger-i18n-selector')) {
      return;
    }

    var selector = document.createElement('div');
    selector.id = 'swagger-i18n-selector';
    selector.className = 'swagger-i18n-selector';

    var savedLang = getLanguage();

    var label = document.createElement('label');
    label.setAttribute('for', 'swagger-lang-select');
    label.textContent = '🌐 Language:';

    var indicator = document.createElement('div');
    indicator.className = 'language-indicator';
    indicator.textContent = savedLang.toUpperCase();

    var select = document.createElement('select');
    select.id = 'swagger-lang-select';
    select.innerHTML = LANGUAGE_OPTIONS_HTML;
    select.value = savedLang;

    select.addEventListener('change', function() {
      var selectedLang = this.value;
      localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLang);
      updateUrlWithLanguage(selectedLang);
      indicator.textContent = selectedLang.toUpperCase();
      showLanguageChangeNotification(selectedLang);
    });

    selector.appendChild(label);
    selector.appendChild(indicator);
    selector.appendChild(select);

    document.body.appendChild(selector);
  }

  // Patch Swagger UI request interceptor to add Accept-Language header
  function patchRequestInterceptor() {
    try {
      if (window.ui && window.ui.getConfigs) {
        var configs = window.ui.getConfigs();
        var originalInterceptor = configs.requestInterceptor;

        configs.requestInterceptor = function(request) {
          if (originalInterceptor) {
            request = originalInterceptor(request);
          }

          if (request && request.headers) {
            var lang = getLanguage();
            request.headers['Accept-Language'] = lang;
          }

          return request;
        };
      }
    } catch (e) {
      console.debug('Could not patch request interceptor:', e);
    }
  }

  // Initialize when DOM is ready
  function init() {
    initLanguageSelector();
    patchRequestInterceptor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also initialize after Swagger UI loads (in case of async loading)
  var observer = new MutationObserver(function(mutations) {
    if (document.querySelector('.swagger-ui')) {
      init();
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
`;

  return {
    // Use customJsStr to inject JavaScript without eval() - CSP compliant
    customJsStr: [customJsStr],
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCss: `
      /* Language Selector Styles */
      .swagger-i18n-selector {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 100;
        padding: 12px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }

      .swagger-i18n-selector label {
        color: white;
        font-weight: 600;
        font-size: 14px;
        margin: 0;
        white-space: nowrap;
      }

      .swagger-i18n-selector select {
        padding: 8px 12px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        min-width: 180px;
        transition: all 0.2s ease;
      }

      .swagger-i18n-selector select:hover {
        background: white;
        border-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .swagger-i18n-selector select:focus {
        outline: none;
        border-color: white;
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
      }

      .swagger-i18n-selector .language-indicator {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        text-transform: uppercase;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .swagger-i18n-selector {
          top: 5px;
          right: 5px;
          padding: 8px 12px;
        }

        .swagger-i18n-selector label {
          font-size: 12px;
        }

        .swagger-i18n-selector select {
          min-width: 140px;
          font-size: 12px;
          padding: 6px 10px;
        }
      }

      /* Hide default Swagger topbar if needed */
      .swagger-ui .topbar {
        display: none;
      }
    `,
  };
}
