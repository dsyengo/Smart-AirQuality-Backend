import chalk from 'chalk';
import { format } from 'date-fns';

export const logger = (req, res, next) => {
    const start = process.hrtime(); // High-res timer

    res.on('finish', () => {
        const { method, originalUrl } = req;
        const { statusCode } = res;

        const [seconds, nanoseconds] = process.hrtime(start);
        const durationMs = (seconds * 1e9 + nanoseconds) / 1e6; // convert to ms

        const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
        const statusColor = statusCode >= 500
            ? chalk.red
            : statusCode >= 400
                ? chalk.yellow
                : statusCode >= 300
                    ? chalk.cyan
                    : chalk.green;

        console.log(
            `${chalk.gray(`[${timestamp}]`)} ${chalk.blue(method)} ${chalk.white(originalUrl)} - ${statusColor(statusCode)} ${chalk.magenta(`(${durationMs.toFixed(2)} ms)`)}`
        );
    });

    next();
};