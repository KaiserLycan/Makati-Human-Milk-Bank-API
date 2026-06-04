export const Authorize = (req, res, next) => {
    if (!req.user || req.user.role !== "manager") {
        return res.status(403).json({
            error: 'Forbidden. You do not have permission to access this resource.'
        });
    }
    next();
};