class ChatHistory {
    constructor() {
        this.storageKey = 'eventManagerChatHistory';
        this.initialize();
    }
    
    initialize() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }
    
    saveMessage(message, sender, timestamp) {
        const history = this.getHistory();
        const today = new Date().toDateString();
        
        // Find or create today's entry
        let todayEntry = history.find(entry => entry.date === today);
        if (!todayEntry) {
            todayEntry = { date: today, messages: [] };
            history.unshift(todayEntry); // Add to beginning for recent first
        }
        
        // Add the message
        todayEntry.messages.push({
            text: message,
            sender: sender,
            timestamp: timestamp
        });
        
        // Keep only last 7 days
        const recentHistory = history.slice(0, 7);
        
        // Save back to localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(recentHistory));
    }
    
    getHistory() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }
    
    getRecentHistory(days = 7) {
        const history = this.getHistory();
        return history.slice(0, days);
    }
    
    clearHistory() {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
}

// Create global instance
window.chatHistory = new ChatHistory();