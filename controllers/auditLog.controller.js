import { prisma } from '../db/db.ts';

export const FetchAuditLogs = async (req, res) => {
    try {
        const logs = await prisma.audit_log.findMany({
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

        return res.status(200).json(logs);

    } catch (error) {
        console.log('Error fetching audit logs');
        console.log( error)
        return res.status(500).json({error: 'Internal server error'});
    }
};