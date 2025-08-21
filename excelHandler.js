class ExcelHandler {
    constructor() {
        this.filename = 'event_manager_events.xlsx';
        this.initialize();
    }
    
    initialize() {
        // Initialize with empty events array if not exists
        if (!localStorage.getItem('event_manager_events_data')) {
            localStorage.setItem('event_manager_events_data', JSON.stringify([]));
        }
    }
    
    saveEventToExcel(eventData) {
        try {
            // Get existing events
            const events = this.getEvents();
            
            // Add new event with creation timestamp
            events.push({
                'Event Name': eventData.name,
                'Event ID': eventData.id,
                'Timezone': eventData.timezone,
                'Date': eventData.date,
                'Location': eventData.location,
                'Description': eventData.description,
                'Created At': new Date().toISOString()
            });
            
            // Save back to localStorage
            localStorage.setItem('event_manager_events_data', JSON.stringify(events));
            
            // Also create and offer download of actual Excel file
            this.downloadExcel(events);
            
            logger.log(`Event saved: ${eventData.name}`);
            return true;
        } catch (error) {
            console.error('Error saving event:', error);
            logger.log(`Error saving event: ${error.message}`);
            return false;
        }
    }
    
    downloadExcel(events) {
        try {
            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(events);
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Events');
            
            // Generate Excel file and offer download
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Error downloading Excel:', error);
            logger.log(`Error downloading Excel: ${error.message}`);
        }
    }
    
    getEvents() {
        try {
            const eventsData = localStorage.getItem('event_manager_events_data');
            return eventsData ? JSON.parse(eventsData) : [];
        } catch (error) {
            console.error('Error reading events:', error);
            logger.log(`Error reading events: ${error.message}`);
            return [];
        }
    }
    
    getRecentEvents(limit = 10) {
        try {
            const events = this.getEvents();
            // Sort by creation date, newest first
            return events.sort((a, b) => {
                return new Date(b['Created At']) - new Date(a['Created At']);
            }).slice(0, limit);
        } catch (error) {
            console.error('Error getting recent events:', error);
            return [];
        }
    }
    
    clearEvents() {
        localStorage.setItem('event_manager_events_data', JSON.stringify([]));
    }
}

// Create global instance
window.excelHandler = new ExcelHandler();