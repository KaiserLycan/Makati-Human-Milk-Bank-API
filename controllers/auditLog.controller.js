import { GetAuditLogs } from '../services/auditLog.service.js';

export const FetchAuditLogs = async (req, res) => {
    try {
        const logs = await GetAuditLogs();

        return res.status(200).json({
            success: true,
            data: logs
        });

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};