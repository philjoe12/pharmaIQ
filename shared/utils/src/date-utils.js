"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toISOString = toISOString;
exports.formatDate = formatDate;
exports.timeAgo = timeAgo;
exports.isExpired = isExpired;
function toISOString(date) {
    return new Date(date).toISOString();
}
function formatDate(date) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return new Date(date).toLocaleDateString('en-US', options);
}
function timeAgo(date) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 }
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
        }
    }
    return 'just now';
}
function isExpired(expirationDate) {
    return new Date(expirationDate) < new Date();
}
//# sourceMappingURL=date-utils.js.map