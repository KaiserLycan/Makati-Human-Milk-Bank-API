import { prisma } from '../db/db.ts';

export const GetAuditLogs = async () => {
    return await prisma.audit_log.findMany({
        orderBy: {
            performed_at: 'desc'
        },
        include: {
            user: {
                select: {
                    user_id: true,
                    name: true,
                    role: true,
                    email: true
                }
            }
        }
    });
};