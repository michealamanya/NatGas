import { Response } from 'express';
import { prisma } from '../database/client.js';
import { AuthenticatedRequest, successResponse } from '../types/index.js';

// GET /api/admin/dashboard
export async function getDashboard(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const [
    totalProducts,
    publishedProducts,
    totalServices,
    totalNews,
    totalJobs,
    openJobs,
    totalApplications,
    newApplications,
    totalContacts,
    unreadContacts,
    totalUsers,
    activeUsers,
    totalPages,
    recentActivity,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: 'PUBLISHED' } }),
    prisma.service.count({ where: { status: 'PUBLISHED' } }),
    prisma.newsArticle.count({ where: { status: 'PUBLISHED' } }),
    prisma.job.count(),
    prisma.job.count({ where: { status: 'PUBLISHED' } }),
    prisma.jobApplication.count(),
    prisma.jobApplication.count({ where: { status: 'NEW' } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.page.count(),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
  ]);

  // System status check
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'unhealthy';
  }

  res.status(200).json(
    successResponse({
      counts: {
        products: { total: totalProducts, published: publishedProducts },
        services: { total: totalServices },
        news: { total: totalNews },
        jobs: { total: totalJobs, open: openJobs },
        applications: { total: totalApplications, new: newApplications },
        contacts: { total: totalContacts, unread: unreadContacts },
        users: { total: totalUsers, active: activeUsers },
        pages: { total: totalPages },
      },
      recentActivity,
      system: {
        status: dbStatus,
        timestamp: new Date().toISOString(),
      },
    }),
  );
}
