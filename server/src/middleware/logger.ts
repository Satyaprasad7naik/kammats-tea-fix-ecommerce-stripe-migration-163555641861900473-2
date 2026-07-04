import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = uuidv4();

    // Assign request ID to the response header for client visibility
    res.setHeader('X-Request-ID', requestId);

    // Once the response finishes, log the request details and duration as a structured JSON object
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            timestamp: new Date().toISOString(),
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip
        };
        console.log(JSON.stringify(logData));
    });

    next();
};
