class LLMService {
    constructor() {
        this.apiUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large';
        // Fallback API if the primary one doesn't work
        this.fallbackApiUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
        this.isUsingFallback = false;
    }
    
    async generateResponse(message, context = '') {
        try {
            // Try primary API first
            let response = await this.callAPI(this.apiUrl, message, context);
            
            // If primary API fails, try fallback
            if (!response || response.error) {
                this.isUsingFallback = true;
                response = await this.callAPI(this.fallbackApiUrl, message, context);
            }
            
            if (response && response.generated_text) {
                return response.generated_text;
            } else {
                throw new Error('No response from AI model');
            }
        } catch (error) {
            console.error('Error generating response:', error);
            logger.log(`LLM Error: ${error.message}`, 'error');
            
            // Return a fallback response
            return this.getFallbackResponse(message);
        }
    }
    
    async callAPI(url, message, context) {
        try {
            const payload = {
                inputs: {
                    text: message,
                    past_user_inputs: context ? [context] : [],
                    generated_responses: context ? [this.generateContextResponse(context)] : []
                },
                parameters: {
                    max_length: 500, // Increased length for detailed responses
                    temperature: 0.9,
                    repetition_penalty: 1.2
                }
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
    
    generateContextResponse(context) {
        // Generate a simple response based on context for the API
        if (context.includes('greet')) return 'Hello! How can I help you with event planning?';
        if (context.includes('event')) return 'I can help you create an event. Just let me know what you need!';
        return 'I\'m here to help. What would you like to know?';
    }
    
    async generateEventResponse(eventData) {
        try {
            // Use a direct API call with a more reliable model
            const response = await this.callEventAPI(eventData);
            return response;
        } catch (error) {
            console.error('Error generating event response:', error);
            
            // Fallback event confirmation with detailed procedure
            return this.getEventFallbackResponse(eventData);
        }
    }
    
    async callEventAPI(eventData) {
        // Try to use a more reliable API endpoint
        try {
            const API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base";
            const headers = {
                "Authorization": "Bearer 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",
                "Content-Type": "application/json"
            };
            
            const prompt = `Generate a detailed event triggering procedure based on these details:
            Event Name: ${eventData.name}
            Event ID: ${eventData.id}
            Timezone: ${eventData.timezone}
            Date: ${eventData.date}
            Location: ${eventData.location}
            Description: ${eventData.description}
            
            Provide a step-by-step guide on how to trigger this event, including preparation, execution, and expected outcomes.`;
            
            const response = await fetch(API_URL, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ inputs: prompt })
            });
            
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }
            
            const result = await response.json();
            return result[0]?.generated_text || this.getEventFallbackResponse(eventData);
        } catch (error) {
            console.error('Event API call failed:', error);
            return this.getEventFallbackResponse(eventData);
        }
    }
    
    getEventFallbackResponse(eventData) {
        return `Thank you for creating your event! 🎉

Here are your event details:
📅 Event: ${eventData.name}
🆔 ID: ${eventData.id}
🌐 Timezone: ${eventData.timezone}
⏰ Date & Time: ${eventData.date}
📍 Location: ${eventData.location}
📝 Description: ${eventData.description}

To trigger this event, follow these detailed steps:

1. PRE-EVENT PREPARATION:
   - Verify all event details are correct as listed above
   - Set up the event infrastructure based on the location (${eventData.location})
   - Prepare any necessary equipment, materials, or technology
   - Create a timeline based on the event date (${eventData.date}) in timezone ${eventData.timezone}

2. PARTICIPANT COMMUNICATION:
   - Send invitations with the event ID (${eventData.id}) for tracking
   - Include all relevant details: date, time, location, and description
   - Set up reminders for participants based on the timezone (${eventData.timezone})

3. EVENT EXECUTION:
   - On the event day, arrive early to set up ${eventData.location}
   - Follow the event timeline precisely
   - Engage with participants as described: ${eventData.description}
   - Use the event ID (${eventData.id}) for check-in and tracking

4. POST-EVENT ACTIVITIES:
   - Gather feedback from participants
   - Send follow-up materials
   - Analyze event success metrics

Expected outcome:
- Participants will experience "${eventData.name}" as described: ${eventData.description}
- The event will run smoothly according to the planned schedule in ${eventData.timezone}
- You'll receive valuable feedback for future improvements
- The event will be successfully tracked using ID: ${eventData.id}

Your event has been successfully saved and is ready to be triggered! Let me know if you need any changes or assistance with anything else!`;
    }
    
    getFallbackResponse(message) {
        // Simple rule-based responses as fallback
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return "Hello! I'm EventManager, your event planning assistant. How can I help you today?";
        }
        
        if (lowerMessage.includes('event') && lowerMessage.includes('create')) {
            return "I'd be happy to help you create an event! Let me ask you a few questions to get started.";
        }
        
        if (lowerMessage.includes('thank')) {
            return "You're welcome! Is there anything else I can help you with today?";
        }
        
        if (lowerMessage.includes('how') && lowerMessage.includes('work')) {
            return "I help you create and manage events! Just tell me you want to create an event, and I'll guide you through the process step by step. I'll ask for details like event name, ID, timezone, date, location, and description. Once I have all the information, I'll create a comprehensive event plan with detailed triggering instructions for you!";
        }
        
        if ((lowerMessage.includes('view') || lowerMessage.includes('show')) && lowerMessage.includes('event')) {
            return "I can show you your created events. Let me check what events you have...";
        }
        
        return "I'm here to help you manage events. You can say something like 'I want to create an event' to get started!";
    }
}

// Create global instance
window.llmService = new LLMService();