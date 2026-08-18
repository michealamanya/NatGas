import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { createSlug } from '../utils/slug.js';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('\n🌱 Starting NATGAS Uganda database seed...\n');

  // ==================== SUPER ADMIN ====================
  const adminEmail = 'admin@natgasuganda.com';
  const adminPassword = 'NatGas@Admin2024!';
  const adminPasswordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 2,
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: 'superadmin',
      passwordHash: adminPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log(`✅ Super admin: ${superAdmin.email} (username: ${superAdmin.username})`);

  // ==================== PRODUCT CATEGORIES ====================
  const categories = [
    { name: 'LPG Cylinders', description: 'Standard domestic and commercial LPG cylinders', displayOrder: 1 },
    { name: 'Commercial', description: 'LPG solutions for commercial and hospitality businesses', displayOrder: 2 },
    { name: 'Industrial', description: 'Bulk LPG supply for industrial operations', displayOrder: 3 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const slug = createSlug(cat.name);
    const category = await prisma.productCategory.upsert({
      where: { slug },
      update: {},
      create: { name: cat.name, slug, description: cat.description, displayOrder: cat.displayOrder },
    });
    createdCategories[cat.name] = category.id;
    console.log(`✅ Product category: ${category.name}`);
  }

  // ==================== PRODUCTS ====================
  const products = [
    {
      name: '3kg LPG Cylinder',
      category: 'LPG Cylinders',
      cylinderSize: '3kg',
      weight: 3,
      shortDescription: 'Compact 3kg LPG cylinder, perfect for small households and camping.',
      description: 'The NATGAS 3kg LPG cylinder is lightweight and portable, ideal for small households, camping, and supplemental cooking fuel. Safe, reliable, and easy to handle.',
      features: ['Lightweight and portable', 'Safety valve included', 'Ideal for small households', 'Perfect for camping & outdoor use'],
      safetyInfo: 'Store upright in a well-ventilated area. Keep away from heat sources. Check connections before use.',
      specifications: { 'Net Weight': '3 kg', 'Gross Weight': '5 kg', 'Height': '32 cm', 'Diameter': '18 cm' },
      displayOrder: 1,
    },
    {
      name: '6kg LPG Cylinder',
      category: 'LPG Cylinders',
      cylinderSize: '6kg',
      weight: 6,
      shortDescription: 'Standard 6kg LPG cylinder for everyday household cooking.',
      description: 'The NATGAS 6kg cylinder is our most popular household size, offering an excellent balance of value and convenience for everyday cooking needs.',
      features: ['Standard household size', 'Long-lasting fuel supply', 'Compatible with standard regulators', 'Safety pressure relief valve'],
      safetyInfo: 'Store upright in a well-ventilated area. Inspect cylinder for damage before use.',
      specifications: { 'Net Weight': '6 kg', 'Gross Weight': '9.5 kg', 'Height': '42 cm', 'Diameter': '22 cm' },
      isFeatured: true,
      displayOrder: 2,
    },
    {
      name: '12.5kg LPG Cylinder',
      category: 'LPG Cylinders',
      cylinderSize: '12.5kg',
      weight: 12.5,
      shortDescription: 'Popular 12.5kg cylinder for medium to large households.',
      description: 'The NATGAS 12.5kg cylinder is perfect for medium to large households and small businesses. Fewer refills, more cooking time.',
      features: ['Ideal for large families', 'Fewer refills needed', 'Suitable for homes and small restaurants', 'Durable steel construction'],
      safetyInfo: 'Store upright and secure. Do not store near flammable materials.',
      specifications: { 'Net Weight': '12.5 kg', 'Gross Weight': '22 kg', 'Height': '56 cm', 'Diameter': '30 cm' },
      isFeatured: true,
      displayOrder: 3,
    },
    {
      name: '38kg LPG Cylinder',
      category: 'Commercial',
      cylinderSize: '38kg',
      weight: 38,
      shortDescription: 'Heavy-duty 38kg cylinder for restaurants, bakeries, and commercial kitchens.',
      description: 'The NATGAS 38kg commercial cylinder is designed for high-consumption environments such as restaurants, hotels, bakeries, and industrial kitchens.',
      features: ['High capacity for commercial use', 'Suitable for multiple appliances', 'Heavy-duty valve and fittings', 'Bulk delivery available'],
      safetyInfo: 'Must be installed by a qualified NATGAS technician. Requires commercial-grade regulator.',
      specifications: { 'Net Weight': '38 kg', 'Gross Weight': '72 kg', 'Height': '95 cm', 'Diameter': '38 cm' },
      displayOrder: 1,
    },
  ];

  for (const p of products) {
    const slug = createSlug(p.name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        categoryId: createdCategories[p.category],
        cylinderSize: p.cylinderSize,
        weight: p.weight,
        shortDescription: p.shortDescription,
        description: p.description,
        features: p.features,
        safetyInfo: p.safetyInfo,
        specifications: p.specifications,
        isAvailable: true,
        status: 'PUBLISHED',
        isFeatured: p.isFeatured ?? false,
        displayOrder: p.displayOrder,
        publishedAt: new Date(),
        createdById: superAdmin.id,
        updatedById: superAdmin.id,
      },
    });
    console.log(`✅ Product: ${p.name}`);
  }

  // ==================== SERVICES ====================
  const services = [
    {
      name: 'LPG Distribution',
      shortDesc: 'Reliable nationwide distribution of liquefied petroleum gas for households.',
      description: 'NATGAS Uganda provides reliable, timely LPG distribution across Uganda, reaching households in urban and rural areas through our extensive dealer network.',
      features: ['Nationwide coverage', 'Quick delivery turnaround', 'Certified delivery personnel', 'Door-to-door service available'],
      icon: 'truck',
      isFeatured: true,
      displayOrder: 1,
    },
    {
      name: 'Commercial LPG',
      shortDesc: 'Tailored LPG supply solutions for hotels, restaurants, and food businesses.',
      description: 'We offer dedicated commercial LPG supply plans for the hospitality and food service industry, ensuring uninterrupted supply and priority support.',
      features: ['Custom supply contracts', 'Priority service', 'Commercial-grade cylinders', 'Installation and maintenance support'],
      icon: 'building',
      isFeatured: true,
      displayOrder: 2,
    },
    {
      name: 'Bulk LPG Supply',
      shortDesc: 'Bulk tanker deliveries for industrial and large commercial operations.',
      description: 'For large industrial consumers, NATGAS provides bulk LPG supply via tanker deliveries directly to your storage facility.',
      features: ['Bulk storage tank supply', 'Scheduled delivery planning', 'Safety inspection included', 'Competitive bulk pricing'],
      icon: 'factory',
      displayOrder: 3,
    },
    {
      name: 'Cylinder Exchange',
      shortDesc: 'Safe and convenient empty cylinder exchange at all NATGAS outlets.',
      description: 'Exchange your empty NATGAS cylinder for a full one at any of our authorized dealers. Quick, safe, and convenient.',
      features: ['Wide dealer network', 'Quick exchange process', 'Cylinder safety inspection', 'All cylinder sizes available'],
      icon: 'refresh',
      displayOrder: 4,
    },
    {
      name: 'Business Solutions',
      shortDesc: 'Integrated LPG energy solutions for businesses of all sizes.',
      description: 'NATGAS Business Solutions provides comprehensive energy consulting, installation, and ongoing supply management for businesses transitioning to cleaner LPG energy.',
      features: ['Energy consumption audit', 'Custom installation', 'Dedicated account manager', 'Flexible payment terms'],
      icon: 'briefcase',
      isFeatured: true,
      displayOrder: 5,
    },
  ];

  for (const s of services) {
    const slug = createSlug(s.name);
    await prisma.service.upsert({
      where: { slug },
      update: {},
      create: {
        name: s.name,
        slug,
        shortDesc: s.shortDesc,
        description: s.description,
        features: s.features,
        icon: s.icon,
        status: 'PUBLISHED',
        isFeatured: s.isFeatured ?? false,
        displayOrder: s.displayOrder,
        createdById: superAdmin.id,
      },
    });
    console.log(`✅ Service: ${s.name}`);
  }

  // ==================== LOCATIONS ====================
  const locations = [
    {
      name: 'Kampala Head Office',
      address: 'Plot 23, Jinja Road, Industrial Area',
      district: 'Kampala',
      region: 'Central',
      phone: '+256 414 123 456',
      email: 'kampala@natgasuganda.com',
      latitude: 0.3176,
      longitude: 32.5825,
      openingHours: 'Monday - Friday: 8:00 AM - 5:00 PM\nSaturday: 9:00 AM - 1:00 PM',
      isHeadquarters: true,
      displayOrder: 1,
    },
    {
      name: 'Entebbe Branch',
      address: 'Entebbe Road, Near Airport Junction',
      district: 'Wakiso',
      region: 'Central',
      phone: '+256 414 234 567',
      email: 'entebbe@natgasuganda.com',
      latitude: 0.0512,
      longitude: 32.4637,
      openingHours: 'Monday - Saturday: 8:00 AM - 6:00 PM',
      isHeadquarters: false,
      displayOrder: 2,
    },
    {
      name: 'Jinja Branch',
      address: 'Main Street, Jinja Town Centre',
      district: 'Jinja',
      region: 'Eastern',
      phone: '+256 434 123 789',
      email: 'jinja@natgasuganda.com',
      latitude: 0.4244,
      longitude: 33.2041,
      openingHours: 'Monday - Saturday: 8:00 AM - 6:00 PM',
      isHeadquarters: false,
      displayOrder: 3,
    },
  ];

  for (const loc of locations) {
    // Ensure only one HQ
    if (loc.isHeadquarters) {
      await prisma.location.updateMany({ where: { isHeadquarters: true }, data: { isHeadquarters: false } });
    }
    const existing = await prisma.location.findFirst({ where: { name: loc.name } });
    if (!existing) {
      await prisma.location.create({
        data: { ...loc, createdById: superAdmin.id },
      });
      console.log(`✅ Location: ${loc.name}`);
    } else {
      console.log(`⏭  Location already exists: ${loc.name}`);
    }
  }

  // ==================== FAQs ====================
  const faqs = [
    {
      question: 'What LPG cylinder sizes does NATGAS Uganda offer?',
      answer: 'NATGAS Uganda offers cylinders in 3kg, 6kg, 12.5kg, and 38kg sizes. The 3kg and 6kg are ideal for households, while the 12.5kg suits larger families. The 38kg is designed for commercial use.',
      category: 'Products',
      displayOrder: 1,
    },
    {
      question: 'How do I get my cylinder refilled?',
      answer: 'You can exchange your empty NATGAS cylinder for a full one at any of our authorized dealer outlets across Uganda. Use the Locations page to find the nearest dealer.',
      category: 'Getting Started',
      displayOrder: 2,
    },
    {
      question: 'Is LPG safe to use at home?',
      answer: 'Yes, LPG is very safe when used correctly. Always ensure your cylinder is upright, connections are secure, and the area is well-ventilated. Never store cylinders indoors or near heat sources.',
      category: 'Safety',
      displayOrder: 3,
    },
    {
      question: 'What should I do if I smell gas?',
      answer: "If you smell gas: do not use any electrical switches or open flames, extinguish any burning material, close the cylinder valve immediately, open windows and doors for ventilation, and move everyone out of the area. Call NATGAS Uganda emergency line immediately.",
      category: 'Safety',
      displayOrder: 4,
    },
    {
      question: 'How long does a 6kg cylinder last?',
      answer: 'A 6kg cylinder typically lasts a family of 4 between 2 to 4 weeks, depending on cooking frequency and appliance types. Using a single burner for 3 meals a day, it may last up to 3 weeks.',
      category: 'Products',
      displayOrder: 5,
    },
    {
      question: 'Does NATGAS Uganda offer bulk supply for businesses?',
      answer: 'Yes! We provide bulk LPG tanker deliveries for industrial and large commercial consumers. Contact our commercial team for a custom supply agreement and pricing.',
      category: 'Business',
      displayOrder: 6,
    },
    {
      question: 'How do I become a NATGAS Uganda authorized dealer?',
      answer: 'To become an authorized NATGAS dealer, contact our business development team via the contact form or call our head office. We will guide you through the application, requirements, and training process.',
      category: 'Business',
      displayOrder: 7,
    },
    {
      question: 'What payment methods does NATGAS Uganda accept?',
      answer: 'NATGAS Uganda accepts cash, mobile money (MTN Mobile Money and Airtel Money), and bank transfers for commercial accounts. Our dealers may offer additional payment options.',
      category: 'Payments',
      displayOrder: 8,
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.fAQ.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.fAQ.create({ data: faq });
      console.log(`✅ FAQ: ${faq.question.substring(0, 50)}...`);
    } else {
      console.log(`⏭  FAQ already exists`);
    }
  }

  // ==================== NEWS ARTICLES ====================
  const newsCategory = await prisma.newsCategory.upsert({
    where: { slug: 'company-news' },
    update: {},
    create: { name: 'Company News', slug: 'company-news', description: 'Latest updates from NATGAS Uganda' },
  });

  const articles = [
    {
      title: 'NATGAS Uganda Expands Distribution Network to Eastern Uganda',
      slug: 'natgas-expands-eastern-uganda',
      summary: 'NATGAS Uganda has opened three new distribution points in the Eastern region, bringing clean LPG energy closer to communities in Jinja, Mbale, and Soroti.',
      content: `NATGAS Uganda Limited is proud to announce the expansion of its distribution network to Eastern Uganda, with new outlets now operational in Jinja, Mbale, and Soroti districts.

This expansion is part of our commitment to making clean, affordable energy accessible to all Ugandans. The Eastern region has experienced growing demand for LPG as households and businesses transition from traditional charcoal and firewood to cleaner cooking fuels.

"This expansion represents a major milestone in our journey to provide every Ugandan household with access to safe and reliable LPG," said the Managing Director of NATGAS Uganda.

The new distribution points are fully stocked with 3kg, 6kg, and 12.5kg cylinders and will be supported by trained technicians for installation and safety guidance.`,
      isFeatured: true,
    },
    {
      title: 'Safety Tips for LPG Users This Holiday Season',
      slug: 'lpg-safety-tips-holiday-season',
      summary: 'With increased cooking activity during the holidays, NATGAS Uganda reminds customers of essential LPG safety practices to keep your family safe.',
      content: `The holiday season brings more cooking, more gatherings, and more LPG usage. NATGAS Uganda wants to ensure every family stays safe this festive period with these essential safety reminders.

**1. Always Check Connections**
Before lighting your stove, always check that the hose and regulator are properly connected with no leaks. Apply soapy water to connections – bubbles indicate a leak.

**2. Never Leave Cooking Unattended**
Always turn off the gas supply at the cylinder valve when cooking is complete, not just at the stove.

**3. Store Cylinders Properly**
Cylinders should always be stored upright in a cool, well-ventilated area away from direct sunlight and heat sources.

**4. Keep a Fire Extinguisher Handy**
Ensure you have a functional fire extinguisher in your kitchen and that family members know how to use it.

**5. Emergency Contact**
In case of a gas emergency, call NATGAS Uganda immediately at +256 414 123 456.

From all of us at NATGAS Uganda, we wish you a safe and joyful holiday season.`,
      isFeatured: false,
    },
  ];

  for (const article of articles) {
    const existing = await prisma.newsArticle.findUnique({ where: { slug: article.slug } });
    if (!existing) {
      await prisma.newsArticle.create({
        data: {
          ...article,
          categoryId: newsCategory.id,
          authorId: superAdmin.id,
          createdById: superAdmin.id,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });
      console.log(`✅ News article: ${article.title.substring(0, 50)}...`);
    } else {
      console.log(`⏭  News article already exists: ${article.slug}`);
    }
  }

  // ==================== JOBS ====================
  const jobs = [
    {
      title: 'LPG Distribution Driver',
      slug: 'lpg-distribution-driver',
      department: 'Operations',
      location: 'Kampala',
      employmentType: 'FULL_TIME' as const,
      description: 'NATGAS Uganda is seeking experienced drivers to join our distribution team. You will be responsible for safe and timely delivery of LPG cylinders to customers across Kampala and surrounding areas.',
      responsibilities: `- Safely load, transport, and deliver LPG cylinders to customers and dealers
- Conduct pre-trip vehicle safety inspections
- Maintain delivery records and customer receipts
- Uphold NATGAS safety standards at all times
- Report any vehicle or delivery issues promptly`,
      requirements: `- Valid Uganda Class B or C driving license with 3+ years of experience
- Clean driving record
- Basic literacy and numeracy skills
- Knowledge of Kampala roads
- Ability to lift and handle cylinders (physical fitness required)
- Previous LPG or fuel distribution experience is an advantage`,
      benefits: `- Competitive monthly salary
- Health insurance coverage
- Safety training and certification
- Performance bonuses
- Career development opportunities`,
      salaryRange: 'UGX 800,000 - 1,200,000 per month',
      status: 'PUBLISHED' as const,
      isFeatured: true,
    },
    {
      title: 'Sales & Marketing Executive',
      slug: 'sales-marketing-executive',
      department: 'Sales & Marketing',
      location: 'Kampala',
      employmentType: 'FULL_TIME' as const,
      description: 'We are looking for an energetic Sales & Marketing Executive to drive growth in our residential and commercial LPG customer base.',
      responsibilities: `- Identify and develop new business opportunities in target markets
- Manage relationships with existing dealers and commercial clients
- Conduct market surveys and competitive analysis
- Develop and implement promotional activities
- Achieve monthly and quarterly sales targets
- Prepare sales reports and forecasts`,
      requirements: `- Bachelors degree in Business, Marketing, or a related field
- Minimum 2 years of sales experience (FMCG or energy sector preferred)
- Strong communication and interpersonal skills
- Proficiency in MS Office
- Valid driving permit is an advantage
- Fluent in English and Luganda`,
      benefits: `- Competitive base salary + commission structure
- Company vehicle for field work
- Health insurance
- Professional development allowance
- Annual performance bonus`,
      salaryRange: 'UGX 1,500,000 - 2,500,000 + Commission',
      status: 'PUBLISHED' as const,
      isFeatured: true,
    },
  ];

  for (const job of jobs) {
    const existing = await prisma.job.findUnique({ where: { slug: job.slug } });
    if (!existing) {
      await prisma.job.create({
        data: { ...job, createdById: superAdmin.id, publishedAt: new Date() },
      });
      console.log(`✅ Job: ${job.title}`);
    } else {
      console.log(`⏭  Job already exists: ${job.slug}`);
    }
  }

  // ==================== WEBSITE SETTINGS ====================
  const settings = [
    { key: 'company_name', value: 'NATGAS Uganda Limited', type: 'string', category: 'general', label: 'Company Name' },
    { key: 'company_tagline', value: 'Clean Energy for Every Ugandan Home', type: 'string', category: 'general', label: 'Company Tagline' },
    { key: 'company_phone', value: '+256 414 123 456', type: 'string', category: 'contact', label: 'Company Phone' },
    { key: 'company_email', value: 'info@natgasuganda.com', type: 'string', category: 'contact', label: 'Company Email' },
    { key: 'company_address', value: 'Plot 23, Jinja Road, Industrial Area, Kampala, Uganda', type: 'string', category: 'contact', label: 'Company Address' },
    { key: 'social_facebook', value: 'https://facebook.com/natgasuganda', type: 'string', category: 'social', label: 'Facebook URL' },
    { key: 'social_twitter', value: 'https://twitter.com/natgasuganda', type: 'string', category: 'social', label: 'Twitter/X URL' },
    { key: 'social_linkedin', value: 'https://linkedin.com/company/natgasuganda', type: 'string', category: 'social', label: 'LinkedIn URL' },
    { key: 'footer_text', value: '© 2024 NATGAS Uganda Limited. All rights reserved.', type: 'string', category: 'general', label: 'Footer Text' },
    { key: 'seo_default_title', value: 'NATGAS Uganda – Clean LPG Energy', type: 'string', category: 'seo', label: 'Default SEO Title' },
    { key: 'seo_default_description', value: 'NATGAS Uganda Limited provides reliable, affordable LPG gas cylinders and energy solutions for households and businesses across Uganda.', type: 'string', category: 'seo', label: 'Default SEO Description' },
    { key: 'homepage_hero_title', value: 'Clean Energy for Every Ugandan Home', type: 'string', category: 'homepage', label: 'Hero Title' },
    { key: 'homepage_hero_subtitle', value: 'Reliable, affordable LPG cylinders delivered to your doorstep. Trusted by thousands of households and businesses across Uganda.', type: 'string', category: 'homepage', label: 'Hero Subtitle' },
  ];

  for (const setting of settings) {
    await prisma.websiteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ Website settings (${settings.length} entries)`);

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Seed completed successfully!\n');
  console.log('📋 LOGIN CREDENTIALS:');
  console.log('   Email:    admin@natgasuganda.com');
  console.log('   Password: NatGas@Admin2024!');
  console.log('   Role:     SUPER_ADMIN');
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((err) => {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
