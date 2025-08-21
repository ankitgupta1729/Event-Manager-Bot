class ExcelHandler {
    constructor() {
        this.filename = 'event_manager_events.xlsx';
    }
    
    saveEventToExcel(eventData) {
        try {
            // Try to read existing workbook
            let workbook;
            try {
                const existingFile = localStorage.getItem(this.filename);
                if (existingFile) {
                    workbook = XLSX.read(existingFile, { type: 'string' });
                } else {
                    workbook = XLSX.utils.book_new();
                }
            } catch (e) {
                workbook = XLSX.utils.book_new();
            }
            
            // Try to get the worksheet or create it
            let worksheet;
            if (workbook.SheetNames.includes('Events')) {
                worksheet = workbook.Sheets['Events'];
            } else {
                worksheet = XLSX.utils.json_to_sheet([]);
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Events');
            }
            
            // Convert current data to worksheet
            const currentData = XLSX.utils.sheet_to_json(worksheet);
            currentData.push({
                'Event Name': eventData.name,
                'Event ID': eventData.id,
                'Timezone': eventData.timezone,
                'Date': eventData.date,
                'Location': eventData.location,
                'Description': eventData.description,
                'Created At': new Date().toISOString()
            });
            
            // Create new worksheet with updated data
            const newWorksheet = XLSX.utils.json_to_sheet(currentData);
            
            // Replace the worksheet in the workbook
            workbook.Sheets['Events'] = newWorksheet;
            
            // Save to localStorage
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'string' });
            localStorage.setItem(this.filename, excelBuffer);
            
            // Also offer download
            this.downloadExcel(workbook);
            
            logger.log(`Event saved to Excel: ${eventData.name}`);
        } catch (error) {
            console.error('Error saving to Excel:', error);
            logger.log(`Error saving to Excel: ${error.message}`);
        }
    }
    
    downloadExcel(workbook) {
        try {
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
            const existingFile = localStorage.getItem(this.filename);
            if (!existingFile) return [];
            
            const workbook = XLSX.read(existingFile, { type: 'string' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            return XLSX.utils.sheet_to_json(worksheet);
        } catch (error) {
            console.error('Error reading events from Excel:', error);
            logger.log(`Error reading events from Excel: ${error.message}`);
            return [];
        }
    }
}

// Create global instance
window.excelHandler = new ExcelHandler();