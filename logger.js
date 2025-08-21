class Logger {
    constructor() {
        this.logStorageKey = 'eventManagerLogs';
        this.maxLogEntries = 1000;
        this.initialize();
    }
    
    initialize() {
        if (!localStorage.getItem(this.logStorageKey)) {
            localStorage.setItem(this.logStorageKey, JSON.stringify([]));
        }
    }
    
    log(message, level = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message
        };
        
        const logs = this.getLogs();
        logs.push(logEntry);
        
        // Keep only the most recent entries
        if (logs.length > this.maxLogEntries) {
            logs.splice(0, logs.length - this.maxLogEntries);
        }
        
        localStorage.setItem(this.logStorageKey, JSON.stringify(logs));
        
        // Also output to console
        console.log(`[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`);
    }
    
    getLogs() {
        return JSON.parse(localStorage.getItem(this.logStorageKey) || '[]');
    }
    
    exportLogs() {
        const logs = this.getLogs();
        const logText = logs.map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eventmanager_logs_${new Date().toISOString().slice(0, 10)}.log`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    clearLogs() {
        localStorage.setItem(this.logStorageKey, JSON.stringify([]));
    }
}

// Create global instance
window.logger = new Logger();