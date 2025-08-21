class Logger {
    constructor() {
        this.logStorageKey = 'eventManagerLogs';
        this.eventLogsKey = 'eventManagerEventLogs';
        this.maxLogEntries = 1000;
        this.initialize();
    }
    
    initialize() {
        if (!localStorage.getItem(this.logStorageKey)) {
            localStorage.setItem(this.logStorageKey, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.eventLogsKey)) {
            localStorage.setItem(this.eventLogsKey, JSON.stringify([]));
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
        
        this.downloadFile(logText, `eventmanager_logs_${new Date().toISOString().slice(0, 10)}.log`);
        return true;
    }
    
    // Create a detailed log file with event data
    createEventLog(eventData, action = 'created') {
        const timestamp = new Date().toISOString();
        const logEntry = `
EVENT ${action.toUpperCase()} - ${timestamp}
===========================================
Event Name: ${eventData.name || 'N/A'}
Event ID: ${eventData.id || 'N/A'}
Timezone: ${eventData.timezone || 'N/A'}
Date: ${eventData.date || 'N/A'}
Location: ${eventData.location || 'N/A'}
Description: ${eventData.description || 'N/A'}
Created At: ${timestamp}
-------------------------------------------
        `.trim();
        
        this.log(`Event ${action}: ${eventData.name || 'Unknown'} (ID: ${eventData.id || 'N/A'})`, 'event');
        
        // Also save to a separate event log
        this.saveToEventLog(logEntry);
        
        return logEntry;
    }
    
    // Save to a separate event log storage
    saveToEventLog(logEntry) {
        let eventLogs = JSON.parse(localStorage.getItem(this.eventLogsKey) || '[]');
        
        eventLogs.push({
            timestamp: new Date().toISOString(),
            entry: logEntry
        });
        
        // Keep only the most recent event logs
        if (eventLogs.length > 50) {
            eventLogs.splice(0, eventLogs.length - 50);
        }
        
        localStorage.setItem(this.eventLogsKey, JSON.stringify(eventLogs));
    }
    
    // Export event logs
    exportEventLogs() {
        const eventLogs = JSON.parse(localStorage.getItem(this.eventLogsKey) || '[]');
        
        if (eventLogs.length === 0) {
            return false;
        }
        
        const logText = eventLogs.map(log => log.entry).join('\n\n');
        this.downloadFile(logText, `eventmanager_events_${new Date().toISOString().slice(0, 10)}.log`);
        return true;
    }
    
    // Generic file download method
    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // Get all event logs
    getEventLogs() {
        return JSON.parse(localStorage.getItem(this.eventLogsKey) || '[]');
    }
    
    // Get all system logs
    getSystemLogs() {
        return this.getLogs();
    }
    
    // Export all logs (both system and event logs)
    exportAllLogs() {
        const systemLogs = this.getSystemLogs();
        const eventLogs = this.getEventLogs();
        
        let allLogs = '=== SYSTEM LOGS ===\n\n';
        allLogs += systemLogs.map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`).join('\n');
        
        allLogs += '\n\n=== EVENT LOGS ===\n\n';
        allLogs += eventLogs.map(log => log.entry).join('\n\n');
        
        this.downloadFile(allLogs, `eventmanager_all_logs_${new Date().toISOString().slice(0, 10)}.log`);
        return true;
    }
    
    clearLogs() {
        localStorage.setItem(this.logStorageKey, JSON.stringify([]));
        this.log('All system logs cleared', 'info');
    }
    
    clearEventLogs() {
        localStorage.setItem(this.eventLogsKey, JSON.stringify([]));
        this.log('All event logs cleared', 'info');
    }
    
    clearAllLogs() {
        this.clearLogs();
        this.clearEventLogs();
        this.log('All logs cleared', 'info');
    }
}

// Create global instance
window.logger = new Logger();