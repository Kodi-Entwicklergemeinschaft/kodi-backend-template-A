/**
 * Default email theme configuration
 * Used when no city is selected or city theme is not configured
 */
export interface CityEmailTheme {
  appName: string;
  appNameDisplay: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  /**
   * Key for city-specific greeting in translation files.
   * Used to lookup translations like 'emails.verification.greetingKodi'
   * If not set or translation not found, falls back to default 'emails.verification.greeting'
   */
  greetingKey?: string;
  /** External URL for logo image (PNG/JPG recommended for email compatibility) */
  logoUrl?: string | null;
  /** Logo width in pixels. Defaults to 180 */
  logoWidth?: number;
  /** Logo height in pixels. Defaults to auto (proportional) */
  logoHeight?: number;
  emailTheme?: {
    headerBackgroundColor?: string;
    footerBackgroundColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  };
}

export const DEFAULT_EMAIL_THEME: CityEmailTheme = {
  appName: 'mein.Kodi',
  appNameDisplay: 'mein.Kodi',
  primaryColor: '#009EE0',
  secondaryColor: '#1a1a2e',
  accentColor: '#009EE0',
  greetingKey: 'kodi', // Uses 'emails.verification.greetingKodi' translation key
  logoUrl: null, // Set your cloud logo URL here, e.g., 'https://cdn.example.com/logos/mein_kodi.png'
  logoWidth: 180,
  logoHeight: 31,
  emailTheme: {
    headerBackgroundColor: '#1a1a2e',
    footerBackgroundColor: '#009EE0',
    buttonColor: '#ffffff',
    buttonTextColor: '#009EE0',
  },
};
