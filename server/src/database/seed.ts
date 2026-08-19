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
      name: 'Authorized LPG Products Distribution',
      shortDesc: 'Receive and fill all your gas cylinders with the number one authorized distributor of all LPG products.',
      description: 'Natgas Uganda is the authorized distributor of LPG products for major oil companies in Uganda. We provide reliable last-mile logistics and distribution partnership, ensuring every cylinder reaches you safely and on time.',
      features: ['Authorized by major oil companies', 'Nationwide distribution network', 'Certified cylinder handling', 'Safe delivery protocols'],
      icon: 'truck',
      isFeatured: true,
      displayOrder: 1,
    },
    {
      name: 'Accessories & Equipment Supply',
      shortDesc: 'Get all your gas equipment and accessories from the leading authorized service provider of LPG installations.',
      description: 'Your trusted source for certified, high-quality LPG cylinders, regulators, hoses, fittings, flanges, T-joints and all accessories. We stock only approved, tested equipment.',
      features: ['Certified equipment only', 'Flanges of all sizes and classes', 'Brass adaptors and fittings', 'Hoses and regulators'],
      icon: 'package',
      isFeatured: true,
      displayOrder: 2,
    },
    {
      name: 'LPG Systems Design',
      shortDesc: 'Unlock the power of smart, safe and scalable LPG solutions with our expert design services.',
      description: 'Our engineers develop shop drawings and LPG system designs that meet UNBS and international safety standards. From residential to large industrial projects, we design systems that are safe, efficient and scalable.',
      features: ['UNBS-compliant designs', 'Shop drawing preparation', 'Site assessment included', 'Scalable from residential to industrial'],
      icon: 'pencil-ruler',
      isFeatured: true,
      displayOrder: 3,
    },
    {
      name: 'LPG Tank Installation',
      shortDesc: 'From site assessment to final commissioning, we deliver end-to-end LPG tank installation.',
      description: 'Seamless and safe LPG tank installation services. Our certified team handles everything from site surveys and foundation preparation to tank mounting, piping and final safety commissioning.',
      features: ['End-to-end project management', 'Site assessment and engineering', 'Safety commissioning', 'Compliance certification'],
      icon: 'hard-hat',
      isFeatured: true,
      displayOrder: 4,
    },
    {
      name: 'Industrial Gas Pipe Installation',
      shortDesc: 'Expert craftsmanship with industry-leading standards for your gas pipelines.',
      description: 'Natgas Uganda combines expert craftsmanship with industry-leading standards for industrial and commercial gas pipelines. We handle design, supply of materials and installation to the highest safety standards.',
      features: ['Full pipeline installation', 'Certified welders and pipefitters', 'Pressure testing included', 'Code-compliant installations'],
      icon: 'pipeline',
      displayOrder: 5,
    },
    {
      name: 'LPG Systems Installation',
      shortDesc: 'Install seamless and secure LPG systems with verified expertise services.',
      description: 'Complete LPG system installation for residential, commercial and institutional clients. Our verified engineers ensure every connection, valve and fitting meets safety standards before handover.',
      features: ['Complete system installation', 'Residential and commercial', 'Safety inspection at handover', 'Compliance documentation'],
      icon: 'settings',
      displayOrder: 6,
    },
    {
      name: 'Industrial Burner Installation',
      shortDesc: 'High-performance industrial burners for optimal energy efficiency, safety and compliance.',
      description: 'We design and install industrial burner systems for factories, bakeries, food processing plants and other industrial facilities. Our installations prioritize energy efficiency, safety and full regulatory compliance.',
      features: ['High-efficiency burner selection', 'Industrial-scale capacity', 'Safety compliance documentation', 'Commissioning and testing'],
      icon: 'flame',
      displayOrder: 7,
    },
    {
      name: 'School LPG Systems Solutions',
      shortDesc: 'Upgrade your school lab and kitchen with certified LPG green efficient gas systems.',
      description: 'Natgas Uganda helps schools upgrade their laboratory and kitchen facilities with certified, safe and efficient LPG systems. Our team works to minimize disruption during installation and provides full staff training.',
      features: ['Lab and kitchen installations', 'Safety training for staff', 'Minimal operational disruption', 'Cost-effective energy solution'],
      icon: 'school',
      displayOrder: 8,
    },
    {
      name: 'Maintenance & Non-Destructive Testing (NDT)',
      shortDesc: 'Test, maintain and validate gas systems with our NDT testing and maintenance team.',
      description: 'Advanced non-destructive testing to ensure material and weld integrity without causing damage. Combined with our proactive maintenance programmes, we keep your LPG systems safe, efficient and compliant.',
      features: ['Non-destructive testing (NDT)', 'Destructive testing (DT)', 'Preventive maintenance plans', 'Emergency maintenance response'],
      icon: 'search',
      isFeatured: true,
      displayOrder: 9,
    },
    {
      name: 'LPG Industrial Systems Inspection',
      shortDesc: 'Ensure safety, efficiency and compliance of LPG systems with certified inspection services.',
      description: 'Comprehensive LPG system inspections for factories, commercial facilities, hotels and institutions. Our certified inspectors produce detailed reports with actionable safety and compliance recommendations.',
      features: ['Full system audit', 'Certified inspection reports', 'Compliance verification', 'Corrective action recommendations'],
      icon: 'clipboard-check',
      isFeatured: true,
      displayOrder: 10,
    },
    {
      name: 'LPG Tank Maintenance',
      shortDesc: 'Routine checks and preventive care of your LPG tanks with our expert maintenance team.',
      description: 'Keep your LPG tanks in peak condition with our scheduled maintenance programmes. We cover everything from valve and fitting checks to corrosion monitoring, leak testing and safety certification.',
      features: ['Scheduled preventive maintenance', 'Valve and fitting inspection', 'Corrosion and leak monitoring', 'Safety recertification'],
      icon: 'wrench',
      displayOrder: 11,
    },
    {
      name: 'Expert LPG Technical Consultancy',
      shortDesc: 'Tailored solutions with certified professionals for safe, efficient and compliant LPG systems.',
      description: 'Expert strategic advice and solutions for the oil and gas sector. Our consultants provide feasibility studies, risk assessments, regulatory guidance and technical recommendations for LPG projects of any scale.',
      features: ['Feasibility studies', 'Risk assessments', 'Regulatory guidance', 'Project management support'],
      icon: 'briefcase',
      isFeatured: true,
      displayOrder: 12,
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
      name: 'Natgas Uganda Head Office',
      address: 'Kawuku, Entebbe Road',
      district: 'Wakiso',
      region: 'Central',
      phone: '+256 740 938 040',
      email: 'info@natgasuganda.com',
      latitude: 0.0640,
      longitude: 32.5200,
      openingHours: 'Monday - Friday: 8:00 AM - 5:00 PM',
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
    { key: 'company_name', value: 'Natgas Uganda Limited', type: 'string', category: 'general', label: 'Company Name' },
    { key: 'company_tagline', value: 'Authorized LPG Distribution & Technical Services', type: 'string', category: 'general', label: 'Company Tagline' },
    { key: 'company_phone', value: '+256 740 938 040', type: 'string', category: 'contact', label: 'Company Phone (Primary)' },
    { key: 'company_phone_2', value: '+256 781 011 751', type: 'string', category: 'contact', label: 'Company Phone (Secondary)' },
    { key: 'company_email', value: 'info@natgasuganda.com', type: 'string', category: 'contact', label: 'Company Email' },
    { key: 'company_address', value: 'Kawuku, Entebbe Road', type: 'string', category: 'contact', label: 'Company Address' },
    { key: 'company_po_box', value: 'P.O. Box: 700332', type: 'string', category: 'contact', label: 'P.O. Box' },
    { key: 'company_vision', value: 'To be the leading indigenous service company in Oil and Gas Industry.', type: 'string', category: 'general', label: 'Vision Statement' },
    { key: 'company_mission', value: 'To provide safe, reliable and cost-effective LPG energy solutions to homes, businesses and industries across Uganda through expert technical services and responsible distribution.', type: 'string', category: 'general', label: 'Mission Statement' },
    { key: 'social_facebook', value: '#', type: 'string', category: 'social', label: 'Facebook URL' },
    { key: 'social_twitter', value: '#', type: 'string', category: 'social', label: 'Twitter/X URL' },
    { key: 'social_youtube', value: '#', type: 'string', category: 'social', label: 'YouTube URL' },
    { key: 'social_linkedin', value: '#', type: 'string', category: 'social', label: 'LinkedIn URL' },
    { key: 'footer_text', value: '© 2026 All rights reserved. Natgas Uganda Limited', type: 'string', category: 'general', label: 'Footer Text' },
    { key: 'seo_default_title', value: 'Natgas Uganda Limited – LPG Distribution & Technical Services', type: 'string', category: 'seo', label: 'Default SEO Title' },
    { key: 'seo_default_description', value: 'Natgas Uganda Limited – authorized LPG distributor and technical services provider offering system design, installation, maintenance and NDT testing across Uganda.', type: 'string', category: 'seo', label: 'Default SEO Description' },
    { key: 'homepage_hero_title', value: 'Seamless and Safe LPG Energy Solutions', type: 'string', category: 'homepage', label: 'Hero Title' },
    { key: 'homepage_hero_subtitle', value: "Uganda's authorized distributor and technical services provider for LPG products, installations, maintenance and consultancy.", type: 'string', category: 'homepage', label: 'Hero Subtitle' },
    { key: 'business_hours', value: 'Monday – Friday: 8:00 AM – 5:00 PM', type: 'string', category: 'contact', label: 'Business Hours' },
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
