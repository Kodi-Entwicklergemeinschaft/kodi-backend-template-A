import { PrismaClient as PrismaUsersClient } from '@prisma/client-users';

const prisma = new PrismaUsersClient();

const salutations = [
  // English
  { code: 'MR', label: 'Mr', locale: 'en', sortOrder: 1 },
  { code: 'MRS', label: 'Mrs', locale: 'en', sortOrder: 2 },
  { code: 'DIVERS', label: 'Mx', locale: 'en', sortOrder: 3 },

  // German (de)
  { code: 'MR', label: 'Herr', locale: 'de', sortOrder: 1 },
  { code: 'MRS', label: 'Frau', locale: 'de', sortOrder: 2 },
  { code: 'DIVERS', label: 'Divers', locale: 'de', sortOrder: 3 },

  // Arabic (ar)
  { code: 'MR', label: 'السيد', locale: 'ar', sortOrder: 1 },
  { code: 'MRS', label: 'السيدة', locale: 'ar', sortOrder: 2 },
  { code: 'DIVERS', label: 'متنوع', locale: 'ar', sortOrder: 3 },

  // Danish (dk)
  { code: 'MR', label: 'Hr.', locale: 'dk', sortOrder: 1 },
  { code: 'MRS', label: 'Fru', locale: 'dk', sortOrder: 2 },
  { code: 'DIVERS', label: 'Hen', locale: 'dk', sortOrder: 3 },

  // Norwegian (no)
  { code: 'MR', label: 'Hr.', locale: 'no', sortOrder: 1 },
  { code: 'MRS', label: 'Fru', locale: 'no', sortOrder: 2 },
  { code: 'DIVERS', label: 'Hen', locale: 'no', sortOrder: 3 },

  // Swedish (se)
  { code: 'MR', label: 'Hr', locale: 'se', sortOrder: 1 },
  { code: 'MRS', label: 'Fru', locale: 'se', sortOrder: 2 },
  { code: 'DIVERS', label: 'Hen', locale: 'se', sortOrder: 3 },

  // Persian/Farsi (fa)
  { code: 'MR', label: 'آقای', locale: 'fa', sortOrder: 1 },
  { code: 'MRS', label: 'خانم', locale: 'fa', sortOrder: 2 },
  { code: 'DIVERS', label: 'متنوع', locale: 'fa', sortOrder: 3 },

  // Turkish (tr)
  { code: 'MR', label: 'Bay', locale: 'tr', sortOrder: 1 },
  { code: 'MRS', label: 'Bayan', locale: 'tr', sortOrder: 2 },
  { code: 'DIVERS', label: 'Diğer', locale: 'tr', sortOrder: 3 },

  // Russian (ru)
  { code: 'MR', label: 'Г-н', locale: 'ru', sortOrder: 1 },
  { code: 'MRS', label: 'Г-жа', locale: 'ru', sortOrder: 2 },
  { code: 'DIVERS', label: 'Разное', locale: 'ru', sortOrder: 3 },

  // Ukrainian (uk)
  { code: 'MR', label: 'Пан', locale: 'uk', sortOrder: 1 },
  { code: 'MRS', label: 'Пані', locale: 'uk', sortOrder: 2 },
  { code: 'DIVERS', label: 'Інше', locale: 'uk', sortOrder: 3 },
];

async function main() {
  console.log('🌱 Seeding salutations...');

  for (const salutation of salutations) {
    await prisma.salutation.upsert({
      where: {
        code_locale: {
          code: salutation.code,
          locale: salutation.locale,
        },
      },
      update: {
        label: salutation.label,
        sortOrder: salutation.sortOrder,
        isActive: true,
      },
      create: salutation,
    });
  }

  console.log(`✅ Successfully seeded ${salutations.length} salutations`);
  console.log('📊 Summary:');
  const locales = [...new Set(salutations.map((s) => s.locale))];
  for (const locale of locales) {
    const count = salutations.filter((s) => s.locale === locale).length;
    console.log(`   - ${locale}: ${count} salutations`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding salutations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
