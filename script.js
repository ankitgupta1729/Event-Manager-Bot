class EventManagerChatbot {
    constructor() {
        this.eventData = {
            name: null,
            id: null,
            timezone: null,
            date: null,
            location: null,
            description: null
        };
        
        this.currentQuestionIndex = 0;
        this.isAskingQuestions = false;
        this.questions = [
            {
                question: "What is the name of your event?",
                example: "e.g., Annual Tech Conference, Product Launch Party",
                field: "name",
                validation: (value) => value.length >= 3
            },
            {
                question: "Please provide an event ID:",
                example: "e.g., TECH-2023, PROD-LAUNCH-Q4",
                field: "id",
                validation: (value) => /^[a-zA-Z0-9-_]+$/.test(value)
            },
            {
                question: "What timezone will the event be in?",
                example: "e.g., UTC, EST, PST, GMT+5:30",
                field: "timezone",
                validation: (value) => /^[a-zA-Z\/_+-:0-9]+$/.test(value)
            },
            {
                question: "When is the event? (Please provide date and time)",
                example: "e.g., 2023-12-15 14:30, December 15, 2023 at 2:30 PM",
                field: "date",
                validation: (value) => !isNaN(Date.parse(value)) || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)
            },
            {
                question: "Where will the event take place?",
                example: "e.g., Convention Center, Virtual Meeting, Office Building",
                field: "location",
                validation: (value) => value.length >= 3
            },
            {
                question: "Could you describe the event?",
                example: "e.g., A conference for tech enthusiasts with keynote speakers and workshops",
                field: "description",
                validation: (value) => value.length >= 10
            }
        ];
        
        this.initializeEventListeners();
        this.loadChatHistory();
        this.showInitialSuggestions();
    }
    
    initializeEventListeners() {
        const userInput = document.getElementById('user-input');
        const sendButton = document.getElementById('send-button');
        
        // Send message on button click
        sendButton.addEventListener('click', () => {
            this.handleUserInput();
        });
        
        // Send message on Enter key
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserInput();
            }
        });
        
        // Auto-scroll to bottom when new messages are added
        const chatMessages = document.getElementById('chat-messages');
        const observer = new MutationObserver(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
        observer.observe(chatMessages, { childList: true });
    }
    
    showInitialSuggestions() {
        const suggestions = [
            "Create a new event",
            "How does this work?",
            "Show my recent events"
        ];
        
        this.showSuggestionChips(suggestions);
    }
    
    showSuggestionChips(suggestions) {
        const messageContent = document.createElement('div');
        messageContent.className = 'suggestion-chips';
        
        suggestions.forEach(suggestion => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.textContent = suggestion;
            chip.addEventListener('click', () => {
                document.getElementById('user-input').value = suggestion;
                this.handleUserInput();
            });
            messageContent.appendChild(chip);
        });
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content"></div>
        `;
        
        messageElement.querySelector('.message-content').appendChild(messageContent);
        document.getElementById('chat-messages').appendChild(messageElement);
    }
    
    async handleUserInput() {
        const userInput = document.getElementById('user-input');
        const message = userInput.value.trim();
        
        if (message === '') return;
        
        // Remove any existing suggestion chips
        document.querySelectorAll('.suggestion-chips').forEach(el => el.remove());
        
        // Add user message to chat
        this.addMessageToChat(message, 'user');
        
        // Clear input
        userInput.value = '';
        
        // Process the message with NLP
        const processedMessage = message.toLowerCase();
        
        // Check if user wants to trigger an event
        if (processedMessage.includes('create') && processedMessage.includes('event') || 
            processedMessage.includes('new event') || 
            processedMessage.includes('make event') ||
            processedMessage.includes('trigger event')) {
            this.isAskingQuestions = true;
            this.currentQuestionIndex = 0;
            this.askNextQuestion();
            return;
        }
        
        // Check for view events request
        if (processedMessage.includes('view') && processedMessage.includes('event') || 
            processedMessage.includes('show') && processedMessage.includes('event') ||
            processedMessage.includes('my event') ||
            processedMessage.includes('list event')) {
            this.showTypingIndicator();
            setTimeout(() => {
                this.hideTypingIndicator();
                this.showUserEvents();
            }, 1000);
            return;
        }
        
        // Check for how it works request
        if (processedMessage.includes('how') && processedMessage.includes('work') || 
            processedMessage.includes('what can you do') ||
            processedMessage.includes('explain')) {
            this.showTypingIndicator();
            setTimeout(() => {
                this.hideTypingIndicator();
                this.explainHowItWorks();
            }, 1000);
            return;
        }
        
        // Check for greetings
        if (processedMessage.includes('hello') || processedMessage.includes('hi') || 
            processedMessage.includes('hey') || processedMessage.includes('greeting')) {
            this.showTypingIndicator();
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessageToChat("Hello there! 👋 I'm EventManager, your event planning assistant. How can I help you today?", 'bot');
                this.showSuggestionChips(["Create a new event", "How does this work?", "Show my events"]);
            }, 1000);
            return;
        }
        
        // Check for help request
        if (processedMessage.includes('help') || processedMessage.includes('how does this work')) {
            this.showTypingIndicator();
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessageToChat("I can help you create and manage events! Just say something like 'I want to create an event' and I'll guide you through the process. 🎉", 'bot');
                this.showSuggestionChips(["Create a new event", "What information do you need?"]);
            }, 1000);
            return;
        }
        
        // Check for thanks
        if (processedMessage.includes('thank') || processedMessage.includes('thanks')) {
            this.showTypingIndicator();
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessageToChat("You're welcome! 😊 Is there anything else I can help you with?", 'bot');
                this.showSuggestionChips(["Create another event", "No, that's all"]);
            }, 1000);
            return;
        }
        
        // If we're in the middle of asking questions
        if (this.isAskingQuestions) {
            const currentQuestion = this.questions[this.currentQuestionIndex - 1];
            const validation = currentQuestion.validation(message);
            
            if (!validation) {
                this.showTypingIndicator();
                setTimeout(() => {
                    this.hideTypingIndicator();
                    this.addMessageToChat(`I'm sorry, that doesn't seem valid. ${currentQuestion.question}`, 'bot');
                    this.addMessageToChat(`<div class="example-text">${currentQuestion.example}</div>`, 'bot');
                    logger.log(`Validation failed for ${currentQuestion.field}: ${message}`);
                }, 1000);
                return;
            }
            
            // Store the response
            this.eventData[currentQuestion.field] = message;
            
            // If we have more questions, ask next
            if (this.currentQuestionIndex < this.questions.length) {
                this.askNextQuestion();
            } else {
                // All questions answered
                this.isAskingQuestions = false;
                this.showTypingIndicator();
                
                try {
                    // Save to Excel first
                    excelHandler.saveEventToExcel(this.eventData);
                    
                    // Generate response using LLM
                    const llmResponse = await llmService.generateEventResponse(this.eventData);
                    
                    // Add bot response to chat
                    setTimeout(() => {
                        this.hideTypingIndicator();
                        this.addMessageToChat(llmResponse, 'bot');
                        this.showSuggestionChips(["Create another event", "View my events", "No, thanks"]);
                        logger.log(`Event created: ${JSON.stringify(this.eventData)}`);
                        
                        // Reset event data for next event
                        this.eventData = {
                            name: null,
                            id: null,
                            timezone: null,
                            date: null,
                            location: null,
                            description: null
                        };
                    }, 2000);
                } catch (error) {
                    setTimeout(() => {
                        this.hideTypingIndicator();
                        this.addMessageToChat("I've collected all your event details. Thank you! Your event has been created successfully.", 'bot');
                        excelHandler.saveEventToExcel(this.eventData);
                        this.showSuggestionChips(["Create another event", "View my events"]);
                        logger.log(`Event created with fallback: ${JSON.stringify(this.eventData)}`);
                        
                        // Reset event data for next event
                        this.eventData = {
                            name: null,
                            id: null,
                            timezone: null,
                            date: null,
                            location: null,
                            description: null
                        };
                    }, 2000);
                }
            }
        } else {
            // Regular conversation
            this.showTypingIndicator();
            
            try {
                const response = await llmService.generateResponse(message);
                setTimeout(() => {
                    this.hideTypingIndicator();
                    this.addMessageToChat(response, 'bot');
                    this.showSuggestionChips(["Create an event", "How does this work?"]);
                }, 1500);
            } catch (error) {
                setTimeout(() => {
                    this.hideTypingIndicator();
                    this.addMessageToChat("I'm here to help you manage events. You can say something like 'I want to create an event' to get started!", 'bot');
                    this.showSuggestionChips(["Create an event", "What can you do?"]);
                }, 1500);
            }
        }
    }
    
    showUserEvents() {
        const events = excelHandler.getEvents();
        
        if (events.length === 0) {
            this.addMessageToChat("You haven't created any events yet. Would you like to create one now?", 'bot');
            this.showSuggestionChips(["Create an event", "How does it work?"]);
            return;
        }
        
        let response = "Here are your previously created events:\n\n";
        
        events.forEach((event, index) => {
            response += `📅 ${index + 1}. ${event['Event Name']} (ID: ${event['Event ID']})\n`;
            response += `   ⏰ Date: ${event['Date']}\n`;
            response += `   🌐 Timezone: ${event['Timezone']}\n`;
            response += `   📍 Location: ${event['Location']}\n`;
            response += `   📝 Description: ${event['Description']}\n\n`;
        });
        
        this.addMessageToChat(response, 'bot');
        this.showSuggestionChips(["Create another event", "How does it work?"]);
    }
    
    explainHowItWorks() {
        const explanation = `Sure! Here's how I can help you create and manage events:

1. To create an event, just say "Create an event" or similar
2. I'll ask you for details like:
   - Event name
   - Event ID
   - Timezone
   - Date and time
   - Location
   - Description

3. After collecting all details, I'll generate a comprehensive event summary with step-by-step instructions for triggering the event
4. Your event will be saved to an Excel file
5. You can view all your events anytime by saying "Show my events"

Would you like to create an event now? 🎉`;

        this.addMessageToChat(explanation, 'bot');
        this.showSuggestionChips(["Create an event", "View my events"]);
    }
    
    askNextQuestion() {
        if (this.currentQuestionIndex < this.questions.length) {
            const question = this.questions[this.currentQuestionIndex];
            this.showTypingIndicator();
            
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessageToChat(question.question, 'bot');
                this.addMessageToChat(`<div class="example-text">${question.example}</div>`, 'bot');
                this.currentQuestionIndex++;
            }, 1000);
        }
    }
    
    addMessageToChat(message, sender) {
        const chatMessages = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString();
        
        messageElement.innerHTML = `
            <div class="avatar">
                <i class="fas ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-content">
                <p>${message.replace(/\n/g, '<br>')}</p>
                <span class="timestamp">${timestamp}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Save to chat history
        chatHistory.saveMessage(message, sender, timestamp);
        
        // Update history panel
        this.updateHistoryPanel();
    }
    
    showTypingIndicator() {
        document.getElementById('typing-indicator').style.display = 'block';
    }
    
    hideTypingIndicator() {
        document.getElementById('typing-indicator').style.display = 'none';
    }
    
    loadChatHistory() {
        const history = chatHistory.getRecentHistory(7);
        this.updateHistoryPanel(history);
    }
    
    updateHistoryPanel(history = null) {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        const historyData = history || chatHistory.getRecentHistory(7);
        
        if (historyData.length === 0) {
            historyList.innerHTML = '<p class="no-history">No recent conversations</p>';
            return;
        }
        
        historyData.forEach(day => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(day.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            let preview = 'No messages';
            if (day.messages.length > 0) {
                const lastMessage = day.messages[day.messages.length - 1];
                // Remove HTML tags from preview
                const text = lastMessage.text.replace(/<[^>]*>/g, '');
                preview = text.length > 30 
                    ? text.substring(0, 30) + '...' 
                    : text;
            }
            
            historyItem.innerHTML = `
                <div class="history-date">${date}</div>
                <div class="history-preview">${preview}</div>
            `;
            
            historyItem.addEventListener('click', () => {
                this.loadConversation(day.date);
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    loadConversation(date) {
        // Implementation to load a specific conversation
        console.log(`Loading conversation from ${date}`);
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new EventManagerChatbot();
});