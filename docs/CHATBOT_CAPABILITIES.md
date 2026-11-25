# Kafe Eman AI Chatbot Capabilities

## Overview
The AI chatbot has **full access to all customer data** and can answer questions about orders, favorites, feedback, reservations, loyalty points, and profile information.

---

## ✅ What the Chatbot Can Access

### 1. **Order Information**
- **Active Orders**: Real-time status (pending, confirmed, preparing, ready)
- **Order History**: Last 10 completed/cancelled orders
- **Order Details**: Items, quantity, prices, totals, dates, payment status

**Example Questions:**
- "What's the status of my order?"
- "How much did my last order cost?"
- "What items did I order last week?"
- "When will my order be ready?"

---

### 2. **Favorite Menu Items**
- **Saved Favorites**: All items the customer hearted
- **Item Details**: Name, price, category, branch location
- **Ordering History**: Can reference favorites in recommendations

**Example Questions:**
- "What are my favorite items?"
- "Show me what I saved"
- "What's the price of my favorite coffee?"

---

### 3. **Feedback & Testimonials**
- **Customer Reviews**: All ratings and testimonials submitted
- **Review Status**: Pending, accepted, or rejected
- **Dates & Comments**: When feedback was submitted

**Example Questions:**
- "Have I left any feedback?"
- "What reviews did I write?"
- "Show me my testimonials"

---

### 4. **Reservations**
- **Upcoming Bookings**: Date, time, number of guests, branch
- **Past Reservations**: History of table bookings
- **Booking Status**: Confirmed, cancelled, or closed

**Example Questions:**
- "Do I have any reservations?"
- "When is my table booking?"
- "Show me my past reservations"

---

### 5. **Loyalty Points & Coupons**
- **Current Points**: Total balance and progress to next reward
- **Active Coupons**: Unredeemed discount codes
- **Redeemed Coupons**: Past coupon usage
- **Point Calculation**: 40 pts = 1 free drink coupon

**Example Questions:**
- "How many loyalty points do I have?"
- "How close am I to a free drink?"
- "What coupons do I have?"
- "What's my coupon code?"

---

### 6. **Profile Information**
- **Name, Email, Phone**: Contact details
- **Address & Location**: Delivery address and home branch
- **Date of Birth**: Account information
- **Customer Tier**: Total orders placed and membership status

**Example Questions:**
- "What's my email on file?"
- "Show my phone number"
- "What's my home branch?"

---

## 🔧 How It Works

### Data Flow
```
Customer asks question
     ↓
Chatbot loads user context via buildCustomerContext()
     ↓
Context includes: orders, favorites, feedback, reservations, loyalty, profile
     ↓
Chatbot sends context + question to GROQ AI
     ↓
GROQ generates personalized response
     ↓
Response stored in conversation history
     ↓
Customer receives answer
```

### System Prompt
The chatbot uses a comprehensive system prompt that includes ALL customer data, allowing it to:
- Answer multi-part questions ("Show me my active orders AND favorite items")
- Provide recommendations based on history
- Celebrate milestones ("You're just 5 points away from a free drink!")
- Reference past interactions ("You ordered this same item last month")

---

## 🚀 Recent Improvements

### Added Logging
- `[CHAT]` prefix logs track message flow
- Logs show: user context loaded, data counts, API calls, response generation
- Helps debug issues if chatbot isn't showing expected data

### New Diagnostic Endpoint
```typescript
testChatbotData() // Returns complete breakdown of what data is available
```

Returns:
- User profile summary
- Counts and samples of all data types
- Verification summary

---

## 📝 System Prompt Includes

The chatbot system prompt automatically includes:

```
✅ Active Orders (count + full details)
✅ Order History (last 10)
✅ Favorite Items (all saved)
✅ Feedback/Testimonials (all reviews)
✅ Reservations (all bookings)
✅ Loyalty Points & Coupons
✅ Customer Profile (name, email, phone, address, branch)
✅ Loyalty Thresholds (40 pts = free drink)
```

---

## 🔐 Security & Authentication

- ✅ **Login Required**: Chatbot only works for authenticated Clerk users
- ✅ **Scoped Access**: Each customer only sees their own data
- ✅ **No Admin Data**: Customers cannot access other users' information
- ✅ **Rate Limited**: 10 messages per minute per user (prevents abuse)

---

## 📊 Available Data per Customer

The chatbot loads:

| Data Type | What's Included |
|-----------|-----------------|
| **Orders** | Active (5), Completed (10) |
| **Favorites** | All saved items |
| **Feedback** | Last 5 reviews |
| **Reservations** | Last 5 bookings |
| **Coupons** | All active, last 5 redeemed |
| **Points** | Current balance, total earned |
| **Profile** | All personal details |

---

## 🛠️ For Developers

### Testing Chatbot Data
```typescript
// Call diagnostic endpoint
const result = await convex.ai.chat.testChatbotData.action();

// Returns:
{
  success: true,
  user: { id, name, email, branch },
  data: {
    activeOrders: { count, items },
    orderHistory: { count, items },
    favouriteItems: { count, items },
    feedback: { count, items },
    reservations: { count, items },
    loyalty: { points, totalOrders, activeCoupons, ... }
  },
  summary: "✅ Chatbot has access to..."
}
```

### Files Modified
- `convex/ai/chat.ts` - Enhanced logging + new testChatbotData()
- `convex/ai/context.ts` - buildCustomerContext() (unchanged, already comprehensive)
- `convex/ai/messages.ts` - Message storage (unchanged)
- `convex/ai/threads.ts` - Thread management (unchanged)

---

## ✨ Next Steps

To make the chatbot even smarter:

1. **Add Analytics**: Track which questions are asked most
2. **Personalization**: Remember preferences from conversation history
3. **Proactive Suggestions**: "Your order is almost ready!" notifications
4. **Multi-language Support**: Serve non-English customers
5. **Admin Chat**: Let staff ask about customers in admin panel

---

## 📞 Support

If the chatbot isn't showing expected data:

1. **Check Authentication**: User must be logged in via Clerk
2. **Verify Data Exists**: Use `testChatbotData()` to check what's loaded
3. **Check Logs**: Look for `[CHAT]` prefix in console
4. **Test API Key**: Ensure GROQ_API_KEY is set in environment

