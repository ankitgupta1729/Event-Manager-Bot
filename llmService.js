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
            
            const prompt = `Generate a comprehensive event summary and detailed procedure based on these event details:
            Event Name: ${eventData.name}
            Event ID: ${eventData.id}
            Timezone: ${eventData.timezone}
            Date: ${eventData.date}
            Location: ${eventData.location}
            Description: ${eventData.description}
            
            Provide a detailed summary including:
            1. Event purpose and objectives
            2. Step-by-step procedure for executing the event
            3. Expected outcomes and benefits
            4. Any special considerations based on the event details
            5. A comprehensive conclusion`;
            
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
        return `🎉 **EVENT CREATED SUCCESSFULLY!**

I've created your event based on all the details you provided. Here's a comprehensive summary:

## 📋 EVENT OVERVIEW
**Event Name:** ${eventData.name}
**Event ID:** ${eventData.id}
**Date & Time:** ${eventData.date} (Timezone: ${eventData.timezone})
**Location:** ${eventData.location}

## 🎯 EVENT PURPOSE & OBJECTIVES
Based on your description "${eventData.description}", this event appears to be focused on ${this.getEventPurpose(eventData.description)}. The primary objectives likely include:
- ${this.getObjective1(eventData.description)}
- ${this.getObjective2(eventData.description)}
- ${this.getObjective3(eventData.description)}

## 📝 DETAILED EXECUTION PLAN

### Pre-Event Preparation (1-2 Weeks Before)
1. **Finalize Logistics:** Confirm ${eventData.location} booking and setup requirements
2. **Participant Communication:** Send detailed invitations with event ID ${eventData.id}
3. **Timezone Coordination:** Ensure all participants in ${eventData.timezone} are aware of the timing
4. **Material Preparation:** Develop resources specific to "${eventData.name}"

### Event Day Execution
1. **Setup (2-3 Hours Before):** Arrive at ${eventData.location} to prepare the venue
2. **Registration:** Use event ID ${eventData.id} for participant check-in
3. **Event Flow:** Follow the agenda based on ${eventData.date} schedule
4. **Engagement:** Implement activities as described: ${eventData.description}

### Post-Event Activities (Within 1 Week)
1. **Feedback Collection:** Gather participant insights
2. **Follow-up Communication:** Share resources and next steps
3. **Success Measurement:** Evaluate against event objectives
4. **Documentation:** Archive materials for future reference

## 🎪 EXPECTED OUTCOMES
Based on your event description, participants should experience:
- ${this.getOutcome1(eventData.description)}
- ${this.getOutcome2(eventData.description)}
- ${this.getOutcome3(eventData.description)}

## ⚠️ SPECIAL CONSIDERATIONS
- **Timezone Awareness:** All timing references should be clearly marked as ${eventData.timezone}
- **Venue Specifics:** ${this.getVenueConsiderations(eventData.location)}
- **Content Focus:** Ensure all activities align with: ${eventData.description}

## ✅ CONCLUSION
Your event "${eventData.name}" has been successfully planned and is ready for execution. The event ID ${eventData.id} will help you track all related activities and communications.

Remember to:
- Double-check all timing references for ${eventData.timezone}
- Confirm final details with ${eventData.location}
- Keep your event description in mind: "${eventData.description}"

Let me know if you need any adjustments or additional planning assistance!`;
    }
    
    // Helper methods to generate dynamic content based on event description
    getEventPurpose(description) {
        if (description.toLowerCase().includes('conference') || description.toLowerCase().includes('meeting')) {
            return "knowledge sharing and networking";
        } else if (description.toLowerCase().includes('training') || description.toLowerCase().includes('workshop')) {
            return "skill development and education";
        } else if (description.toLowerCase().includes('party') || description.toLowerCase().includes('celebration')) {
            return "celebration and social connection";
        } else if (description.toLowerCase().includes('product') || description.toLowerCase().includes('launch')) {
            return "product introduction and market engagement";
        } else {
            return "achieving specific goals through organized activities";
        }
    }
    
    getObjective1(description) {
        if (description.toLowerCase().includes('network') || description.toLowerCase().includes('connect')) {
            return "Facilitating meaningful connections between participants";
        } else if (description.toLowerCase().includes('learn') || description.toLowerCase().includes('education')) {
            return "Providing valuable learning experiences and knowledge transfer";
        } else if (description.toLowerCase().includes('celebrate') || description.toLowerCase().includes('social')) {
            return "Creating enjoyable experiences and strengthening relationships";
        } else {
            return "Achieving the primary goals outlined in your event description";
        }
    }
    
    getObjective2(description) {
        if (description.toLowerCase().includes('discuss') || description.toLowerCase().includes('idea')) {
            return "Generating new ideas and solutions through collaborative discussion";
        } else if (description.toLowerCase().includes('demonstrate') || description.toLowerCase().includes('showcase')) {
            return "Effectively presenting products, services, or concepts";
        } else {
            return "Ensuring smooth execution and positive participant experience";
        }
    }
    
    getObjective3(description) {
        return "Creating lasting value and measurable results from the event";
    }
    
    getOutcome1(description) {
        if (description.toLowerCase().includes('technical') || description.toLowerCase().includes('technology')) {
            return "Enhanced understanding of technical concepts and applications";
        } else if (description.toLowerCase().includes('business') || description.toLowerCase().includes('professional')) {
            return "Improved professional capabilities and business insights";
        } else {
            return "Meaningful engagement with the event content and other participants";
        }
    }
    
    getOutcome2(description) {
        if (description.toLowerCase().includes('community') || description.toLowerCase().includes('team')) {
            return "Stronger community bonds and team cohesion";
        } else {
            return "Practical knowledge or skills they can apply after the event";
        }
    }
    
    getOutcome3(description) {
        return "Positive overall experience that meets or exceeds expectations";
    }
    
    getVenueConsiderations(location) {
        if (location.toLowerCase().includes('virtual') || location.toLowerCase().includes('online')) {
            return "Ensure all participants have the necessary technology and access information";
        } else if (location.toLowerCase().includes('office') || location.toLowerCase().includes('building')) {
            return "Coordinate with facility management for access and setup requirements";
        } else {
            return "Confirm all logistics with the venue management including setup times and equipment";
        }
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