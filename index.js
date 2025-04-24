// EventBuddy - Advanced AI Event Planner JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // Gemini API Key and URL
    const API_KEY = 'AIzaSyBmvGxeFJ629IpRdDwBmRiPNt6YqL1vCbg';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    // System prompt to make the AI format responses properly
    const formattingInstructions = `
    You are EventBuddy, an AI event planning assistant. Your goal is to help users plan events by providing helpful suggestions and guidance.
    
    Format your responses with these guidelines:
    - Use <div class="section-title">Title</div> for main section headings
    - Use <h4>Subheading</h4> for subheadings
    - Use <p>Text</p> for paragraphs
    - For bullet lists, use: <ul><li><i class="fas fa-check icon-bullet"></i> Item</li></ul>
    - For numbered lists, use: <ol><li>Item</li></ol>
    - Use <span class="bold">text</span> for emphasis
    
    Important formatting rules:
    1. Do NOT use any HTML tags outside the allowed ones above
    2. NEVER include backticks, \`\`\`html, or similar code markers in your response
    3. Do not use <hr> tags or horizontal dividers
    4. Use icons in bullet points when appropriate using the format <i class="fas fa-[icon-name] icon-bullet"></i>
       - Useful icons: fa-calendar, fa-clock, fa-users, fa-utensils, fa-music, fa-glass-cheers, fa-star
    
    The user will provide information about their event. Create a well-structured response with clear sections.
    Always use proper HTML format without any code indicators or backticks.
    `;
    
    // Store conversation history
    let conversationHistory = [
        {
            role: 'model',
            parts: [{
                text: "Welcome to EventBuddy! I'm your AI event planner, ready to help create your perfect event! To get started, please tell me how many people will attend, how long your event will last, and optionally the type of event."
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

    // Function to handle user message submission
    function handleUserMessage() {
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        // Add user message to chat UI
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

        // Process message and get AI response
        processMessage(userMessage);
    }

    // Function to add a message to the chat UI
    function addMessage(text, sender) {
        // Create message container
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        // Create avatar element
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        
        // Add appropriate icon based on sender
        const icon = document.createElement('i');
        if (sender === 'user') {
            icon.classList.add('fas', 'fa-user');
        } else {
            icon.classList.add('fas', 'fa-robot');
        }
        avatar.appendChild(icon);

        // Create message content container
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        // Handle content differently based on sender
        if (sender === 'user') {
            // For user messages, just add text
            const paragraph = document.createElement('p');
            paragraph.textContent = text;
            messageContent.appendChild(paragraph);
        } else {
            // For bot messages, process HTML to enable formatted content
            messageContent.innerHTML = text;
        }

        // Assemble the complete message
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom of chat window
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to process message and get response from Gemini API
    async function processMessage(userMessage) {
        // Show typing indicator while waiting for response
        showTypingIndicator();

        try {
            // Extract event details for better prompting
            const details = extractEventDetails(userMessage);
            
            // Prepare the request to the Gemini API with enhanced prompt
            const aiPrompt = createEnhancedPrompt(userMessage, details);
            
            // Make the API request
            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{
                                text: aiPrompt
                            }]
                        }
                    ],
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
            
            // Parse the API response
            const data = await response.json();
            
            // Handle API errors
            if (data.error) {
                console.error('Gemini API Error:', data.error);
                removeTypingIndicator();
                addMessage(generateErrorResponse(), 'bot');
                return;
            }
            
            // Extract the AI response
            const botResponse = data.candidates && data.candidates[0] && 
                              data.candidates[0].content && 
                              data.candidates[0].content.parts[0].text;
            
            if (botResponse) {
                // Add to conversation history
                conversationHistory.push({
                    role: 'model',
                    parts: [{
                        text: botResponse
                    }]
                });
                
                // Clean and format the response
                const cleanedResponse = cleanBotResponse(botResponse);
                
                // Remove typing indicator and display response
                removeTypingIndicator();
                addMessage(cleanedResponse, 'bot');
            } else {
                // Handle empty or invalid response
                removeTypingIndicator();
                addMessage(generateFallbackResponse(userMessage, details), 'bot');
            }
            
        } catch (error) {
            // Handle network or other errors
            console.error('Error processing message:', error);
            removeTypingIndicator();
            
            // Attempt to generate a reasonable fallback response
            const details = extractEventDetails(userMessage);
            addMessage(generateFallbackResponse(userMessage, details), 'bot');
        }
    }

    // Function to clean bot response of any code markers and format properly
    function cleanBotResponse(response) {
        // Remove any code markers, html tags, and backticks
        let cleaned = response
            .replace(/```html/g, '')
            .replace(/```/g, '')
            .trim();
            
        // Ensure we don't have missing closing tags
        if (cleaned.includes('<div') && !cleaned.includes('</div>')) {
            cleaned += '</div>';
        }
        
        // Add default section title if none exists
        if (!cleaned.includes('<div class="section-title">')) {
            cleaned = `<div class="section-title">Event Plan <i class="fas fa-calendar-check"></i></div>${cleaned}`;
        }
        
        // Ensure paragraphs are properly formatted
        if (!cleaned.includes('<p>')) {
            const paragraphs = cleaned.split('\n\n');
            cleaned = paragraphs.map(para => {
                if (para.trim() && !para.includes('<div') && !para.includes('<h4>') && 
                    !para.includes('<ul>') && !para.includes('<ol>')) {
                    return `<p>${para}</p>`;
                }
                return para;
            }).join('\n');
        }
        
        return cleaned;
    }

    // Function to generate a smart fallback event plan
    function generateFallbackResponse(userMessage, details) {
        // Try to extract event details and generate a response
        if (details.people && details.duration) {
            const timeDescription = details.timeUnit?.includes('hour') ? 
                `${details.duration} hours` : `${details.duration} days`;
            
            const eventType = details.eventType || "event";
            
            // Generate a well-formatted HTML response
            return `
                <div class="section-title">Event Plan for ${details.people} People <i class="fas fa-calendar-check"></i></div>
                <p>I've created a preliminary plan for your ${eventType} with ${details.people} people lasting ${timeDescription}.</p>
                
                <h4><i class="fas fa-clock"></i> Event Timeline</h4>
                <ol>
                    <li>Welcome & Introduction (${details.timeUnit?.includes('hour') ? '15-30 minutes' : 'First 2 hours'})</li>
                    <li>Ice-Breaker Activities (${details.timeUnit?.includes('hour') ? '30 minutes' : 'Morning of day 1'})</li>
                    <li>Main Event Activities (${details.timeUnit?.includes('hour') ? '1-2 hours' : 'Throughout all days'})</li>
                    <li>Food & Refreshments (${details.timeUnit?.includes('hour') ? '30-45 minutes' : 'Scheduled meal times'})</li>
                    <li>Closing Activities (${details.timeUnit?.includes('hour') ? '15-30 minutes' : 'Last day'})</li>
                </ol>
                
                <h4><i class="fas fa-list-ul"></i> Recommended Activities</h4>
                <ul>
                    <li><i class="fas fa-users icon-bullet"></i> Group games suitable for ${details.people} people</li>
                    <li><i class="fas fa-utensils icon-bullet"></i> Food and beverage suggestions</li>
                    <li><i class="fas fa-music icon-bullet"></i> Entertainment ideas</li>
                </ul>
                
                <p>Would you like me to elaborate on any specific aspect of this plan? I can provide more detailed recommendations for activities, food, decorations, or logistics.</p>
            `;
        } else {
            // Fallback when we couldn't extract sufficient details
            return `
                <div class="section-title">Let's Plan Your Event <i class="fas fa-calendar-check"></i></div>
                <p>I'd love to help you plan your event! To create a customized plan, I need a few key details:</p>
                
                <ul>
                    <li><i class="fas fa-users icon-bullet"></i> How many people will attend?</li>
                    <li><i class="fas fa-clock icon-bullet"></i> How long will the event last?</li>
                    <li><i class="fas fa-calendar-day icon-bullet"></i> What type of event are you planning?</li>
                </ul>
                
                <p>For example, you could say: "I'm planning a birthday party for 20 people for 4 hours" or "I need to organize a corporate retreat for 50 people over 2 days."</p>
            `;
        }
    }

    // Error response when API fails
    function generateErrorResponse() {
        return `
            <div class="section-title">Oops! <i class="fas fa-exclamation-circle"></i></div>
            <p>I'm having a bit of trouble connecting to my planning brain right now. Let me try a different approach.</p>
            
            <h4>How can I help with your event?</h4>
            <p>Please provide these key details so I can create a great plan for you:</p>
            
            <ul>
                <li><i class="fas fa-users icon-bullet"></i> Number of attendees</li>
                <li><i class="fas fa-clock icon-bullet"></i> Duration of event</li>
                <li><i class="fas fa-calendar-day icon-bullet"></i> Type of event (optional)</li>
            </ul>
        `;
    }

    // Extract event details to improve prompting
    function extractEventDetails(message) {
        const details = {
            people: null,
            duration: null,
            timeUnit: null,
            eventType: null
        };
        
        // Extract number of people
        const peopleMatch = message.match(/(\d+)\s*(?:people|person|guests|attendees|participants)/i);
        if (peopleMatch) {
            details.people = parseInt(peopleMatch[1]);
        }
        
        // Extract duration and time unit
        const durationMatch = message.match(/(\d+)\s*(hour|hours|hr|hrs|day|days)/i);
        if (durationMatch) {
            details.duration = parseInt(durationMatch[1]);
            details.timeUnit = durationMatch[2].toLowerCase();
        }
        
        // Extract event type
        const eventTypes = [
            'birthday', 'wedding', 'anniversary', 'graduation', 'baby shower', 
            'bridal shower', 'retirement', 'holiday', 'christmas', 'thanksgiving',
            'halloween', 'easter', 'new year', 'corporate', 'team building',
            'retreat', 'seminar', 'conference', 'workshop', 'meeting', 'dinner',
            'lunch', 'breakfast', 'party', 'celebration', 'gathering', 'reunion',
            'picnic', 'barbecue', 'bbq', 'reception', 'gala', 'fundraiser'
        ];
        
        for (const type of eventTypes) {
            if (message.toLowerCase().includes(type)) {
                details.eventType = type;
                break;
            }
        }
        
        return details;
    }

    // Create enhanced prompt with formatting instructions and context
    function createEnhancedPrompt(userMessage, details) {
        // Base prompt with formatting instructions
        let prompt = formattingInstructions + "\n\n";
        
        // Add conversation context if it's not the first message
        if (conversationHistory.length > 2) {
            prompt += "Previous conversation:\n";
            
            // Include last 3 exchanges (or fewer if conversation is shorter)
            const historyToInclude = conversationHistory.slice(-6);
            
            for (let i = 0; i < historyToInclude.length; i++) {
                const entry = historyToInclude[i];
                const role = entry.role === 'user' ? 'User' : 'EventBuddy';
                prompt += `${role}: ${entry.parts[0].text}\n\n`;
            }
        }
        
        // Add the current user message
        prompt += `The user says: "${userMessage}"\n\n`;
        
        // If we have details, create a more targeted prompt
        if (details.people || details.duration || details.eventType) {
            prompt += "Based on the user's message, I understand these details about their event:\n";
            
            if (details.people) {
                prompt += `- Number of attendees: ${details.people}\n`;
            }
            
            if (details.duration && details.timeUnit) {
                prompt += `- Event duration: ${details.duration} ${details.timeUnit}\n`;
            }
            
            if (details.eventType) {
                prompt += `- Event type: ${details.eventType}\n`;
            }
            
            prompt += "\nCreate a detailed, well-structured event plan with timeline, activities, catering suggestions, and any other relevant recommendations. Ensure your response uses the correct HTML formatting as specified earlier.";
        } else {
            // Generic prompt if we couldn't extract details
            prompt += "Respond helpfully to the user's message with event planning advice. If their message doesn't contain enough information about the event they're planning, politely ask for more details including number of people, duration, and event type.";
        }
        
        return prompt;
    }

    // Typing indicator functions
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot', 'typing-indicator');
        
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        const icon = document.createElement('i');
        icon.classList.add('fas', 'fa-robot');
        avatar.appendChild(icon);
        
        const content = document.createElement('div');
        content.classList.add('message-content');
        
        const paragraph = document.createElement('p');
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            dot.style.animationDelay = `${i * 0.15}s`;
            paragraph.appendChild(dot);
        }
        
        content.appendChild(paragraph);
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(content);
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
});
