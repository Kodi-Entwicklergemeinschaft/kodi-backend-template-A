#!/usr/bin/env ts-node
/**
 * Terms of Use Seeding Script
 *
 * Seeds the users database with default general terms of use for all supported languages.
 * General terms have cityId = null and can be used by all cities.
 *
 * Prerequisites:
 * 1. Run Prisma migration: yarn prisma:migrate (or yarn prisma:migrate:users)
 * 2. Regenerate Prisma client: yarn prisma:generate
 *
 * Run: yarn seed:terms
 * Or: npx ts-node scripts/seed-terms.ts
 */

// Register tsconfig-paths to resolve TypeScript path mappings
import 'tsconfig-paths/register';

import { PrismaClient } from '@prisma/client-users';

const prisma = new PrismaClient();

// Version format: YYYY-MM (e.g., "2024-01", "2024-11")
const getCurrentVersion = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Terms content for all supported languages
// NOTE: These should be professionally translated for production!
const TERMS_BY_LOCALE: Record<string, { title: string; content: string }> = {
  en: {
    title: 'Terms of Use',
    content: `
      <h1>Terms of Use</h1>
      <p>Welcome to KODI Platform. By using our services, you agree to the following terms:</p>

      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.</p>

      <h2>2. Use License</h2>
      <p>Permission is granted to temporarily use this platform for personal, non-commercial transitory viewing only.</p>

      <h2>3. User Account</h2>
      <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

      <h2>4. User Content</h2>
      <p>You are responsible for any content you post on the platform. You agree not to post content that is illegal, harmful, or violates any rights of others.</p>

      <h2>5. Privacy</h2>
      <p>Your use of this platform is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.</p>

      <h2>6. Modifications</h2>
      <p>We reserve the right to modify these terms at any time. We will notify users of any significant changes.</p>

      <h2>7. Contact</h2>
      <p>If you have any questions about these Terms of Use, please contact us.</p>
    `,
  },
  de: {
    title: 'Nutzungsbedingungen',
    content: `
      <h1>Nutzungsbedingungen</h1>
      <p>Willkommen bei der KODI-Plattform. Durch die Nutzung unserer Dienste stimmen Sie den folgenden Bedingungen zu:</p>

      <h2>1. Annahme der Bedingungen</h2>
      <p>Durch den Zugriff auf und die Nutzung dieser Plattform akzeptieren Sie die Bedingungen dieser Vereinbarung und stimmen diesen zu.</p>

      <h2>2. Nutzungslizenz</h2>
      <p>Es wird die Erlaubnis erteilt, diese Plattform vorübergehend nur für persönliche, nicht-kommerzielle Zwecke zu nutzen.</p>

      <h2>3. Benutzerkonto</h2>
      <p>Sie sind für die Geheimhaltung Ihres Kontos und Passworts verantwortlich. Sie erklären sich damit einverstanden, die Verantwortung für alle Aktivitäten zu übernehmen, die unter Ihrem Konto stattfinden.</p>

      <h2>4. Benutzerinhalte</h2>
      <p>Sie sind für alle Inhalte verantwortlich, die Sie auf der Plattform veröffentlichen. Sie verpflichten sich, keine Inhalte zu veröffentlichen, die illegal oder schädlich sind oder die Rechte anderer verletzen.</p>

      <h2>5. Datenschutz</h2>
      <p>Ihre Nutzung dieser Plattform unterliegt auch unserer Datenschutzerklärung. Bitte lesen Sie unsere Datenschutzerklärung, um unsere Praktiken zu verstehen.</p>

      <h2>6. Änderungen</h2>
      <p>Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern. Wir werden die Benutzer über wesentliche Änderungen informieren.</p>

      <h2>7. Kontakt</h2>
      <p>Bei Fragen zu diesen Nutzungsbedingungen kontaktieren Sie uns bitte.</p>
    `,
  },
  ar: {
    title: 'شروط الاستخدام',
    content: `
      <h1>شروط الاستخدام</h1>
      <p>مرحباً بك في منصة KODI. باستخدامك لخدماتنا، فإنك توافق على الشروط التالية:</p>

      <h2>1. قبول الشروط</h2>
      <p>من خلال الوصول إلى هذه المنصة واستخدامها، فإنك تقبل وتوافق على الالتزام بشروط وأحكام هذه الاتفاقية.</p>

      <h2>2. ترخيص الاستخدام</h2>
      <p>يُمنح الإذن باستخدام هذه المنصة مؤقتاً للعرض الشخصي غير التجاري فقط.</p>

      <h2>3. حساب المستخدم</h2>
      <p>أنت مسؤول عن الحفاظ على سرية حسابك وكلمة المرور الخاصة بك. أنت توافق على تحمل المسؤولية عن جميع الأنشطة التي تحدث تحت حسابك.</p>

      <h2>4. محتوى المستخدم</h2>
      <p>أنت مسؤول عن أي محتوى تنشره على المنصة. أنت توافق على عدم نشر محتوى غير قانوني أو ضار أو ينتهك حقوق الآخرين.</p>

      <h2>5. الخصوصية</h2>
      <p>استخدامك لهذه المنصة يخضع أيضاً لسياسة الخصوصية الخاصة بنا. يرجى مراجعة سياسة الخصوصية لفهم ممارساتنا.</p>

      <h2>6. التعديلات</h2>
      <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنقوم بإخطار المستخدمين بأي تغييرات جوهرية.</p>

      <h2>7. الاتصال</h2>
      <p>إذا كانت لديك أي أسئلة حول شروط الاستخدام هذه، يرجى الاتصال بنا.</p>
    `,
  },
  dk: {
    title: 'Brugsvilkår',
    content: `
      <h1>Brugsvilkår</h1>
      <p>Velkommen til KODI-platformen. Ved at bruge vores tjenester accepterer du følgende vilkår:</p>

      <h2>1. Accept af vilkår</h2>
      <p>Ved at tilgå og bruge denne platform accepterer du at være bundet af vilkårene i denne aftale.</p>

      <h2>2. Brugslicens</h2>
      <p>Der gives tilladelse til midlertidigt at bruge denne platform kun til personlig, ikke-kommerciel brug.</p>

      <h2>3. Brugerkonto</h2>
      <p>Du er ansvarlig for at holde din konto og adgangskode fortrolig. Du accepterer ansvaret for alle aktiviteter, der sker under din konto.</p>

      <h2>4. Brugerindhold</h2>
      <p>Du er ansvarlig for alt indhold, du poster på platformen. Du accepterer ikke at poste indhold, der er ulovligt, skadeligt eller krænker andres rettigheder.</p>

      <h2>5. Privatliv</h2>
      <p>Din brug af denne platform er også underlagt vores privatlivspolitik. Læs venligst vores privatlivspolitik for at forstå vores praksis.</p>

      <h2>6. Ændringer</h2>
      <p>Vi forbeholder os retten til at ændre disse vilkår til enhver tid. Vi vil underrette brugerne om væsentlige ændringer.</p>

      <h2>7. Kontakt</h2>
      <p>Hvis du har spørgsmål om disse brugsvilkår, kontakt os venligst.</p>
    `,
  },
  tr: {
    title: 'Kullanım Koşulları',
    content: `
      <h1>Kullanım Koşulları</h1>
      <p>KODI Platformuna hoş geldiniz. Hizmetlerimizi kullanarak aşağıdaki koşulları kabul etmiş olursunuz:</p>

      <h2>1. Koşulların Kabulü</h2>
      <p>Bu platforma erişerek ve kullanarak, bu sözleşmenin hüküm ve koşullarına bağlı olmayı kabul edersiniz.</p>

      <h2>2. Kullanım Lisansı</h2>
      <p>Bu platformu yalnızca kişisel, ticari olmayan geçici görüntüleme için kullanma izni verilmektedir.</p>

      <h2>3. Kullanıcı Hesabı</h2>
      <p>Hesabınızın ve şifrenizin gizliliğini korumaktan siz sorumlusunuz. Hesabınız altında gerçekleşen tüm faaliyetlerin sorumluluğunu kabul edersiniz.</p>

      <h2>4. Kullanıcı İçeriği</h2>
      <p>Platformda yayınladığınız tüm içeriklerden siz sorumlusunuz. Yasadışı, zararlı veya başkalarının haklarını ihlal eden içerik yayınlamamayı kabul edersiniz.</p>

      <h2>5. Gizlilik</h2>
      <p>Bu platformu kullanımınız ayrıca Gizlilik Politikamıza tabidir. Uygulamalarımızı anlamak için lütfen Gizlilik Politikamızı inceleyin.</p>

      <h2>6. Değişiklikler</h2>
      <p>Bu koşulları istediğimiz zaman değiştirme hakkını saklı tutarız. Önemli değişiklikler hakkında kullanıcıları bilgilendireceğiz.</p>

      <h2>7. İletişim</h2>
      <p>Bu Kullanım Koşulları hakkında sorularınız varsa, lütfen bizimle iletişime geçin.</p>
    `,
  },
  ru: {
    title: 'Условия использования',
    content: `
      <h1>Условия использования</h1>
      <p>Добро пожаловать на платформу KODI. Используя наши услуги, вы соглашаетесь со следующими условиями:</p>

      <h2>1. Принятие условий</h2>
      <p>Получая доступ к этой платформе и используя её, вы принимаете и соглашаетесь соблюдать условия данного соглашения.</p>

      <h2>2. Лицензия на использование</h2>
      <p>Предоставляется разрешение на временное использование этой платформы только для личного, некоммерческого просмотра.</p>

      <h2>3. Учётная запись пользователя</h2>
      <p>Вы несёте ответственность за сохранение конфиденциальности вашей учётной записи и пароля. Вы соглашаетесь нести ответственность за все действия, совершаемые под вашей учётной записью.</p>

      <h2>4. Пользовательский контент</h2>
      <p>Вы несёте ответственность за любой контент, который вы публикуете на платформе. Вы соглашаетесь не публиковать контент, который является незаконным, вредным или нарушает права других лиц.</p>

      <h2>5. Конфиденциальность</h2>
      <p>Использование вами этой платформы также регулируется нашей Политикой конфиденциальности. Пожалуйста, ознакомьтесь с нашей Политикой конфиденциальности.</p>

      <h2>6. Изменения</h2>
      <p>Мы оставляем за собой право изменять эти условия в любое время. Мы уведомим пользователей о любых существенных изменениях.</p>

      <h2>7. Контакты</h2>
      <p>Если у вас есть вопросы об этих Условиях использования, пожалуйста, свяжитесь с нами.</p>
    `,
  },
  uk: {
    title: 'Умови використання',
    content: `
      <h1>Умови використання</h1>
      <p>Ласкаво просимо на платформу KODI. Використовуючи наші послуги, ви погоджуєтесь з наступними умовами:</p>

      <h2>1. Прийняття умов</h2>
      <p>Отримуючи доступ до цієї платформи та використовуючи її, ви приймаєте та погоджуєтесь дотримуватися умов цієї угоди.</p>

      <h2>2. Ліцензія на використання</h2>
      <p>Надається дозвіл на тимчасове використання цієї платформи лише для особистого, некомерційного перегляду.</p>

      <h2>3. Обліковий запис користувача</h2>
      <p>Ви несете відповідальність за збереження конфіденційності вашого облікового запису та пароля. Ви погоджуєтесь нести відповідальність за всі дії, що здійснюються під вашим обліковим записом.</p>

      <h2>4. Контент користувача</h2>
      <p>Ви несете відповідальність за будь-який контент, який ви публікуєте на платформі. Ви погоджуєтесь не публікувати контент, який є незаконним, шкідливим або порушує права інших осіб.</p>

      <h2>5. Конфіденційність</h2>
      <p>Використання вами цієї платформи також регулюється нашою Політикою конфіденційності. Будь ласка, ознайомтеся з нашою Політикою конфіденційності.</p>

      <h2>6. Зміни</h2>
      <p>Ми залишаємо за собою право змінювати ці умови в будь-який час. Ми повідомимо користувачів про будь-які суттєві зміни.</p>

      <h2>7. Контакти</h2>
      <p>Якщо у вас є запитання щодо цих Умов використання, будь ласка, зв'яжіться з нами.</p>
    `,
  },
  fa: {
    title: 'شرایط استفاده',
    content: `
      <h1>شرایط استفاده</h1>
      <p>به پلتفرم KODI خوش آمدید. با استفاده از خدمات ما، شما با شرایط زیر موافقت می‌کنید:</p>

      <h2>1. پذیرش شرایط</h2>
      <p>با دسترسی و استفاده از این پلتفرم، شما شرایط و مفاد این توافقنامه را می‌پذیرید.</p>

      <h2>2. مجوز استفاده</h2>
      <p>اجازه استفاده موقت از این پلتفرم فقط برای مشاهده شخصی و غیرتجاری داده می‌شود.</p>

      <h2>3. حساب کاربری</h2>
      <p>شما مسئول حفظ محرمانه بودن حساب و رمز عبور خود هستید. شما موافقت می‌کنید که مسئولیت تمام فعالیت‌هایی که تحت حساب شما انجام می‌شود را بپذیرید.</p>

      <h2>4. محتوای کاربر</h2>
      <p>شما مسئول هر محتوایی هستید که در پلتفرم منتشر می‌کنید. شما موافقت می‌کنید که محتوای غیرقانونی، مضر یا نقض کننده حقوق دیگران منتشر نکنید.</p>

      <h2>5. حریم خصوصی</h2>
      <p>استفاده شما از این پلتفرم همچنین تحت سیاست حریم خصوصی ما قرار دارد. لطفاً سیاست حریم خصوصی ما را برای درک عملکردهای ما مرور کنید.</p>

      <h2>6. تغییرات</h2>
      <p>ما حق تغییر این شرایط را در هر زمان برای خود محفوظ می‌داریم. ما کاربران را از هرگونه تغییرات مهم مطلع خواهیم کرد.</p>

      <h2>7. تماس</h2>
      <p>اگر سؤالی درباره این شرایط استفاده دارید، لطفاً با ما تماس بگیرید.</p>
    `,
  },
  no: {
    title: 'Bruksvilkår',
    content: `
      <h1>Bruksvilkår</h1>
      <p>Velkommen til KODI-plattformen. Ved å bruke våre tjenester godtar du følgende vilkår:</p>

      <h2>1. Aksept av vilkår</h2>
      <p>Ved å få tilgang til og bruke denne plattformen aksepterer du å være bundet av vilkårene i denne avtalen.</p>

      <h2>2. Brukslisens</h2>
      <p>Det gis tillatelse til midlertidig bruk av denne plattformen kun for personlig, ikke-kommersiell bruk.</p>

      <h2>3. Brukerkonto</h2>
      <p>Du er ansvarlig for å holde kontoen din og passordet ditt konfidensielt. Du godtar ansvaret for alle aktiviteter som skjer under kontoen din.</p>

      <h2>4. Brukerinnhold</h2>
      <p>Du er ansvarlig for alt innhold du publiserer på plattformen. Du godtar å ikke publisere innhold som er ulovlig, skadelig eller krenker andres rettigheter.</p>

      <h2>5. Personvern</h2>
      <p>Din bruk av denne plattformen er også underlagt vår personvernpolicy. Vennligst les vår personvernpolicy for å forstå vår praksis.</p>

      <h2>6. Endringer</h2>
      <p>Vi forbeholder oss retten til å endre disse vilkårene når som helst. Vi vil varsle brukerne om vesentlige endringer.</p>

      <h2>7. Kontakt</h2>
      <p>Hvis du har spørsmål om disse bruksvilkårene, vennligst kontakt oss.</p>
    `,
  },
  se: {
    title: 'Användarvillkor',
    content: `
      <h1>Användarvillkor</h1>
      <p>Välkommen till KODI-plattformen. Genom att använda våra tjänster godkänner du följande villkor:</p>

      <h2>1. Godkännande av villkor</h2>
      <p>Genom att komma åt och använda denna plattform accepterar du att vara bunden av villkoren i detta avtal.</p>

      <h2>2. Användningslicens</h2>
      <p>Tillstånd ges att tillfälligt använda denna plattform endast för personlig, icke-kommersiell användning.</p>

      <h2>3. Användarkonto</h2>
      <p>Du ansvarar för att hålla ditt konto och lösenord konfidentiellt. Du godkänner att ta ansvar för alla aktiviteter som sker under ditt konto.</p>

      <h2>4. Användarinnehåll</h2>
      <p>Du ansvarar för allt innehåll du publicerar på plattformen. Du godkänner att inte publicera innehåll som är olagligt, skadligt eller kränker andras rättigheter.</p>

      <h2>5. Integritet</h2>
      <p>Din användning av denna plattform styrs också av vår integritetspolicy. Läs vår integritetspolicy för att förstå vår praxis.</p>

      <h2>6. Ändringar</h2>
      <p>Vi förbehåller oss rätten att ändra dessa villkor när som helst. Vi kommer att meddela användare om väsentliga ändringar.</p>

      <h2>7. Kontakt</h2>
      <p>Om du har frågor om dessa användarvillkor, vänligen kontakta oss.</p>
    `,
  },
};

// All supported locales to seed (matching i18n.supportedLanguages in configuration.ts)
const SUPPORTED_LOCALES = ['en', 'de', 'ar', 'dk', 'tr', 'ru', 'uk', 'fa', 'no', 'se'];

async function seedTerms() {
  console.log('🌱 Starting terms of use seeding...');
  const version = getCurrentVersion();

  try {
    let created = 0;
    let skipped = 0;

    for (const locale of SUPPORTED_LOCALES) {
      const termsContent = TERMS_BY_LOCALE[locale];

      if (!termsContent) {
        console.log(`⚠️  No terms content defined for locale: ${locale}, skipping...`);
        skipped++;
        continue;
      }

      // Check if terms already exist for this locale
      const existingTerms = await prisma.termsOfUse.findFirst({
        where: {
          version,
          locale,
          cityId: { equals: null },
        },
      });

      if (existingTerms) {
        console.log(`ℹ️  Terms already exist for locale: ${locale}, skipping...`);
        skipped++;
        continue;
      }

      // Create terms for this locale
      const terms = await prisma.termsOfUse.create({
        data: {
          version,
          title: termsContent.title,
          content: termsContent.content,
          locale,
          cityId: null,
          isActive: true,
          isLatest: true,
          gracePeriodDays: 7,
        },
      });

      console.log(`✅ Created terms for locale: ${locale} (ID: ${terms.id})`);
      created++;
    }

    console.log(`\n🎉 Terms seeding completed!`);
    console.log(`   Created: ${created} locale(s)`);
    console.log(`   Skipped: ${skipped} locale(s)`);

    console.log('\n💡 Next steps:');
    console.log('   - Review and update translations with professional legal translations');
    console.log('   - Create city-specific terms if needed');
  } catch (error) {
    console.error('❌ Error seeding terms of use:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedTerms().catch((error) => {
  console.error(error);
  process.exit(1);
});
