# AI Chatbot User Guide

## Getting Started

### Requirements
- ✅ Must be logged in to your Kafe Eman account (Clerk authentication)
- ✅ Have a stable internet connection
- ✅ GROQ API must be configured on the server

---

## What You Can Ask

### 🍕 About Your Orders
```
"What's the status of my current order?"
"When will my order be ready?"
"How much did my last order cost?"
"Show me my order history"
"What items did I order on [date]?"
"Do I have any pending orders?"
```

### ❤️ About Favorites
```
"What are my favorite menu items?"
"Show me what I saved"
"What's the price of my favorite cappuccino?"
"Do I have any saved items?"
```

### ⭐ About Reviews & Feedback
```
"Have I left any reviews?"
"Show me my feedback"
"What did I rate last?"
"Can I see my testimonials?"
```

### 🪑 About Reservations
```
"Do I have any table reservations?"
"When is my reservation?"
"Show me my booking history"
"What reservations did I make?"
```

### 🎁 About Loyalty Points
```
"How many loyalty points do I have?"
"How close am I to a free drink?"
"What coupons do I have?"
"Show me my coupon codes"
"How do I earn more points?"
```

### 👤 About Your Profile
```
"What's my phone number?"
"What email is on file?"
"Show my home branch"
"What's my delivery address?"
```

### 🔀 Multi-Topic Questions
```
"Show me my active orders and favorite items"
"What did I order last time and how many points do I have?"
"Tell me about my reservations and coupons"
```

---

## Using the Chatbot

### Step 1: Open the Chat
- Click the chat bubble in the bottom right corner
- Or navigate to the chat section in your account

### Step 2: Make Sure You're Logged In
- If you see "Please log in to your account first", you need to authenticate
- Click "Sign In" and use Clerk authentication

### Step 3: Ask Your Question
- Type your question naturally
- Examples:
  - Simple: "What's my order status?"
  - Detailed: "Can you show me what I ordered last month and how many loyalty points I have?"
  - Follow-up: "What's the price of that?"

### Step 4: Get Your Answer
- The chatbot will search your data and respond
- Responses include specific information from your account
- You can ask follow-up questions in the same conversation

---

## Tips for Better Answers

### ✅ Do This
- Ask natural, conversational questions
- Be specific about dates or items if possible
- Ask follow-up questions in the same chat
- Use words like "my", "I", "show me", "tell me"

### ❌ Don't Do This
- Don't expect the chatbot to place new orders (it's read-only)
- Don't share passwords or sensitive information
- Don't expect real-time GPS tracking (for delivery times)
- Don't ask about other customers' information

---

## Example Conversations

### Example 1: Order Status
```
You: "What's the status of my current order?"
Bot: "You have 1 active order right now. Your order #ORD-20260602-005 
     was confirmed and is currently being prepared. It should be ready 
     for pickup in about 15 minutes at your branch. Your order includes 
     1x Cappuccino and 1x Chocolate Croissant for $12.50."
```

### Example 2: Loyalty Points
```
You: "How close am I to a free coffee?"
Bot: "You currently have 37 loyalty points! You're just 3 points away 
     from earning a free drink coupon. You'll get those 3 more points 
     with your next order. Keep going!"
```

### Example 3: Recommendations
```
You: "Show me my favorite items"
Bot: "Here are your 4 saved favorites:
     - Cappuccino ($5.50) at Downtown Branch
     - Chocolate Croissant ($4.00) at Downtown Branch
     - Iced Latte ($6.00) at Mall Branch
     - Blueberry Muffin ($3.50) at Downtown Branch
     
     Would you like to order any of these today?"
```

### Example 4: Multi-Part Question
```
You: "Tell me about my last order and my current points"
Bot: "Your last completed order (#ORD-20260531-012) was placed on 
     May 31st and included 2x Espresso Shots and 1x Almond Milk for 
     $8.75. You earned 10 loyalty points for that order.
     
     Your current loyalty balance is 37 points - just 3 away from 
     your next free drink coupon!"
```

---

## Troubleshooting

### "I couldn't reach the assistant. Try again in a moment."
- **Cause**: API connection issue or server overload
- **Fix**: Wait a moment and try again, or refresh the page

### "Please log in to your account first."
- **Cause**: You're not authenticated
- **Fix**: Click "Sign In" and complete Clerk authentication

### "Too many messages. Please wait a minute."
- **Cause**: You've sent 10+ messages in 60 seconds
- **Fix**: Wait 1 minute before sending another message

### "Chatbot doesn't know my data"
- **Cause**: Data might not have synced yet, or account is new
- **Fix**: Try refreshing the page or creating some data (place an order, leave a review)

---

## Data Privacy

✅ **What We Keep Private**
- Your chat conversations are stored securely
- Each customer can only see their own data
- Passwords and sensitive info are never shared
- Conversation history is encrypted

✅ **What the Chatbot Can See**
- Your orders and order history
- Your saved favorites
- Your reviews and feedback
- Your reservations
- Your loyalty points and coupons
- Your profile information

❌ **What the Chatbot CANNOT See**
- Payment method details (only last 4 digits if used)
- Other customers' information
- Admin-only data
- Passwords

---

## Frequently Asked Questions

**Q: Can the chatbot place orders for me?**
A: No, the chatbot is read-only. It can tell you about past orders and favorites, but you need to use the menu to place new orders.

**Q: How many messages can I send?**
A: Up to 10 messages per minute. If you hit the limit, wait 1 minute.

**Q: Is my data safe?**
A: Yes! Each customer only sees their own data. Conversations are encrypted and stored securely.

**Q: Can I delete my chat history?**
A: Currently, conversations are stored permanently. Contact support if you have privacy concerns.

**Q: Can the chatbot help with complaints?**
A: The chatbot can share your order history and feedback. For complaints, use the "Contact Us" form for direct support.

**Q: What if the chatbot gives wrong information?**
A: The chatbot only shares information from your account. If data seems wrong, check your orders in your account or contact support.

---

## Need Help?

- 📧 **Email**: support@kafeeman.com
- 📱 **Phone**: [Your Support Number]
- 💬 **Contact Form**: Use the "Get In Touch" page on the website
- 🐛 **Report a Bug**: Let us know if the chatbot isn't working correctly

---

**Enjoy your Kafe Eman AI assistant! 🤖☕**

