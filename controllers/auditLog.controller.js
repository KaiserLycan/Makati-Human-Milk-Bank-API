import { prisma } from '../db/db.ts';

export const FetchAuditLogs = async (req, res) => {
    try {
        const {
            modified_by,
            action_performed,
            table_name,
            start_date,
            end_date,
            page = 1,
            limit = 15,
        } = req.query;

        const where = {};

        if (action_performed) where.action_performed = action_performed;
        if (table_name) where.table_name = table_name;
        if (start_date || end_date) {
            where.performed_at = {};
            if (start_date) where.performed_at.gte = new Date(start_date);
            if (end_date) where.performed_at.lte = new Date(end_date);
        }

        if (modified_by) {
            where.user = {
                name: {
                    contains: modified_by,
                    mode: 'insensitive'
                }
            };
        }

        const totalLogs = await prisma.audit_log.count({ where });

        const logs = await prisma.audit_log.findMany({
            orderBy: {
                performed_at: 'desc'
            },
            where,
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

        return res.status(200).json({
            logs,
            total: totalLogs,
            page: Number(page),
            limit: Number(limit),
        });

    } catch (error) {
        console.log('Error fetching audit logs');
        console.log(error)
        return res.status(500).json({ error: 'Internal server error' });
    }
};