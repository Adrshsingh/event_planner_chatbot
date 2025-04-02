// script.js
document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // Gemini API Key
    const API_KEY = 'AIzaSyBmvGxeFJ629IpRdDwBmRiPNt6YqL1vCbg';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    // Store conversation history
    let conversationHistory = [
        {
            role: 'model',
            parts: [{
                text: "Hi there! I'm EventBuddy, your AI event planner. To get started, please tell me how many people will attend your event and how long it will last."
            }]
        }
    ];

    // Add event listeners
    sendButton.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserMessage();
        }
    });

    // Handle user message
    function handleUserMessage() {
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        // Add user message to chat
        addMessage(userMessage, 'user');
        
        // Add to conversation history
        conversationHistory.push({
            role: 'user',
            parts: [{
                text: userMessage
            }]
        });
        
        // Clear input field
        userInput.value = '';

        // Process the message and get a response
        processMessage(userMessage);
    }

    // Add a message to the chat UI
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        
        const icon = document.createElement('i');
        if (sender === 'user') {
            icon.classList.add('fas', 'fa-user');
        } else {
            icon.classList.add('fas', 'fa-robot');
        }
        avatar.appendChild(icon);

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        messageContent.appendChild(paragraph);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom of chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Process message using the Gemini API
    async function processMessage(userMessage) {
        // Show loading indicator
        showTypingIndicator();

        try {
            // Gemini API Integration
            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: conversationHistory,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                        topP: 0.95,
                        topK: 40
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });
            
            const data = await response.json();
            
            // Handle potential API errors
            if (data.error) {
                console.error('Gemini API Error:', data.error);
                removeTypingIndicator();
                addMessage("I'm sorry, I encountered an error with the AI service. Please try again later.", 'bot');
                return;
            }
            
            // Extract response from Gemini
            const botResponse = data.candidates && data.candidates[0] && 
                              data.candidates[0].content && 
                              data.candidates[0].content.parts[0].text;
            
            if (botResponse) {
                // Add response to conversation history
                conversationHistory.push({
                    role: 'model',
                    parts: [{
                        text: botResponse
                    }]
                });
                
                // Remove typing indicator and add bot response
                removeTypingIndicator();
                addMessage(botResponse, 'bot');
            } else {
                // Handle empty or invalid response
                removeTypingIndicator();
                addMessage("I'm sorry, I wasn't able to generate a response. Please try asking in a different way.", 'bot');
            }
            
        } catch (error) {
            console.error('Error processing message:', error);
            removeTypingIndicator();
            addMessage("I'm sorry, I encountered an error connecting to the AI service. Please check your internet connection and try again.", 'bot');
        }
    }

    // Fallback function in case the API fails
    function generateFallbackResponse(userMessage) {
        // Extract number of people and duration if present
        const peopleMatch = userMessage.match(/(\d+)\s*(people|persons|guests|attendees)/i);
        const timeMatch = userMessage.match(/(\d+)\s*(hours|hour|hrs|hr|days|day)/i);
        
        if (peopleMatch && timeMatch) {
            const people = peopleMatch[1];
            const timeValue = timeMatch[1];
            const timeUnit = timeMatch[2].toLowerCase();
            
            const isHours = timeUnit.includes('hour') || timeUnit.includes('hr');
            const timeDescription = isHours ? `${timeValue} hours` : `${timeValue} days`;
            
            return `Great! I'll plan an event for ${people} people lasting ${timeDescription}. Here's what I recommend:\n\n1. Welcome activities\n2. Interactive ice-breaker activity\n3. Main event activities\n4. Food and refreshments\n5. Wrap-up and goodbyes\n\nWould you like me to suggest specific activities or food options based on your group size?`;
        } else {
            return "To create your event plan, I need to know how many people will attend and how long the event will last. For example, 'I need to plan a party for 20 people for 3 hours' or 'planning an event for 15 people for 2 days'.";
        }
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot', 'typing-indicator');
        
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        
        const icon = document.createElement('i');
        icon.classList.add('fas', 'fa-robot');
        avatar.appendChild(icon);

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        const paragraph = document.createElement('p');
        paragraph.innerHTML = 'Thinking<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
        messageContent.appendChild(paragraph);

        typingDiv.appendChild(avatar);
        typingDiv.appendChild(messageContent);

        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Add animation to the typing indicator dots
    const dotAnimation = document.createElement('style');
    dotAnimation.textContent = `
        @keyframes blink {
            0% { opacity: 0.2; }
            20% { opacity: 1; }
            100% { opacity: 0.2; }
        }
        
        .typing-indicator .dot {
            animation: blink 1.4s infinite;
            animation-fill-mode: both;
        }
        
        .typing-indicator .dot:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-indicator .dot:nth-child(3) {
            animation-delay: 0.4s;
        }
    `;
    document.head.appendChild(dotAnimation);
});// script.js
document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // Gemini API Key
    const API_KEY = 'AIzaSyBmvGxeFJ629IpRdDwBmRiPNt6YqL1vCbg';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    // Store conversation history
    let conversationHistory = [
        {
            role: 'model',
            parts: [{
                text: "Hi there! I'm EventBuddy, your AI event planner. To get started, please tell me how many people will attend your event and how long it will last."
            }]
        }
    ];

    // Add event listeners
    sendButton.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserMessage();
        }
    });

    // Handle user message
    function handleUserMessage() {
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        // Add user message to chat
        addMessage(userMessage, 'user');
        
        // Add to conversation history
        conversationHistory.push({
            role: 'user',
            parts: [{
                text: userMessage
            }]
        });
        
        // Clear input field
        userInput.value = '';

        // Process the message and get a response
        processMessage(userMessage);
    }

    // Add a message to the chat UI
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        
        const icon = document.createElement('i');
        if (sender === 'user') {
            icon.classList.add('fas', 'fa-user');
        } else {
            icon.classList.add('fas', 'fa-robot');
        }
        avatar.appendChild(icon);

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        messageContent.appendChild(paragraph);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom of chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Process message using the Gemini API
    async function processMessage(userMessage) {
        // Show loading indicator
        showTypingIndicator();

        try {
            // Gemini API Integration
            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: conversationHistory,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                        topP: 0.95,
                        topK: 40
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });
            
            const data = await response.json();
            
            // Handle potential API errors
            if (data.error) {
                console.error('Gemini API Error:', data.error);
                removeTypingIndicator();
                addMessage("I'm sorry, I encountered an error with the AI service. Please try again later.", 'bot');
                return;
            }
            
            // Extract response from Gemini
            const botResponse = data.candidates && data.candidates[0] && 
                              data.candidates[0].content && 
                              data.candidates[0].content.parts[0].text;
            
            if (botResponse) {
                // Add response to conversation history
                conversationHistory.push({
                    role: 'model',
                    parts: [{
                        text: botResponse
                    }]
                });
                
                // Remove typing indicator and add bot response
                removeTypingIndicator();
                addMessage(botResponse, 'bot');
            } else {
                // Handle empty or invalid response
                removeTypingIndicator();
                addMessage("I'm sorry, I wasn't able to generate a response. Please try asking in a different way.", 'bot');
            }
            
        } catch (error) {
            console.error('Error processing message:', error);
            removeTypingIndicator();
            addMessage("I'm sorry, I encountered an error connecting to the AI service. Please check your internet connection and try again.", 'bot');
        }
    }

    // Fallback function in case the API fails
    function generateFallbackResponse(userMessage) {
        // Extract number of people and duration if present
        const peopleMatch = userMessage.match(/(\d+)\s*(people|persons|guests|attendees)/i);
        const timeMatch = userMessage.match(/(\d+)\s*(hours|hour|hrs|hr|days|day)/i);
        
        if (peopleMatch && timeMatch) {
            const people = peopleMatch[1];
            const timeValue = timeMatch[1];
            const timeUnit = timeMatch[2].toLowerCase();
            
            const isHours = timeUnit.includes('hour') || timeUnit.includes('hr');
            const timeDescription = isHours ? `${timeValue} hours` : `${timeValue} days`;
            
            return `Great! I'll plan an event for ${people} people lasting ${timeDescription}. Here's what I recommend:\n\n1. Welcome activities\n2. Interactive ice-breaker activity\n3. Main event activities\n4. Food and refreshments\n5. Wrap-up and goodbyes\n\nWould you like me to suggest specific activities or food options based on your group size?`;
        } else {
            return "To create your event plan, I need to know how many people will attend and how long the event will last. For example, 'I need to plan a party for 20 people for 3 hours' or 'planning an event for 15 people for 2 days'.";
        }
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot', 'typing-indicator');
        
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        
        const icon = document.createElement('i');
        icon.classList.add('fas', 'fa-robot');
        avatar.appendChild(icon);

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        const paragraph = document.createElement('p');
        paragraph.innerHTML = 'Thinking<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
        messageContent.appendChild(paragraph);

        typingDiv.appendChild(avatar);
        typingDiv.appendChild(messageContent);

        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Add animation to the typing indicator dots
    const dotAnimation = document.createElement('style');
    dotAnimation.textContent = `
        @keyframes blink {
            0% { opacity: 0.2; }
            20% { opacity: 1; }
            100% { opacity: 0.2; }
        }
        
        .typing-indicator .dot {
            animation: blink 1.4s infinite;
            animation-fill-mode: both;
        }
        
        .typing-indicator .dot:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-indicator .dot:nth-child(3) {
            animation-delay: 0.4s;
        }
    `;
    document.head.appendChild(dotAnimation);
});