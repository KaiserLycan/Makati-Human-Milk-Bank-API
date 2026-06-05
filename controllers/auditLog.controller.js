import { prisma } from '../db/db.ts';

export const FetchAuditLogs = async (req, res) => {
    try {
        const {
            modified_by,
            action_performed,
            table_name,
            start_date,
            end_date,
            page=1,
            limit=15,
        } = req.query;

        const logs = await prisma.audit_log.findMany({
            orderBy: {
                performed_at: 'desc'
            },
            where: {
                action_performed,
                table_name,
                performed_at: {
                  lte: start_date ? new Date(start_date) : undefined,
                  gte: end_date ? new Date(end_date) : undefined,
                },
                user: {
                    name: modified_by
                }
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
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