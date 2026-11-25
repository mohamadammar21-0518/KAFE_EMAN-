# AI Chatbot Debug Checklist

Use this checklist when the chatbot isn't showing expected data.

---

## 🔍 Step 1: User Authentication

- [ ] **Customer is logged in**
  - Check if Clerk authentication is active
  - Look for login button vs user profile in navbar
  - **Fix**: Ask customer to sign in

- [ ] **No auth errors in console**
  - Look for: `UNAUTHENTICATED: Please log in to your account first`
  - **Fix**: Ensure Clerk is configured correctly

---

## 📊 Step 2: Check Data Exists

### Orders
- [ ] **Customer has placed orders**
  - [ ] Check admin panel → Orders → by this customer
  - [ ] Or check `orders` table for `clerkUserId` match
  - **Fix**: Create test order if none exist

### Favorites
- [ ] **Customer has saved items**
  - [ ] Check account → Favorites page
  - [ ] Or check `userFavorites` table for `userId`
  - **Fix**: Heart an item to create a favorite

### Feedback
- [ ] **Customer has submitted reviews**
  - [ ] Check account → My Feedback page
  - [ ] Or check `testimonials` table for `clerkUserId`
  - **Fix**: Leave a test review

### Reservations
- [ ] **Customer has made reservations**
  - [ ] Check account → Reservations page
  - [ ] Or check `reservations` table for matching email
  - **Fix**: Create a test reservation

### Loyalty Points
- [ ] **Customer has points accumulated**
  - [ ] Check `users` table → `points` field
  - [ ] Or check account dashboard
  - **Fix**: Create an order to earn points

---

## 🔧 Step 3: Run Diagnostic

### Option A: In Convex Console
```typescript
// Execute this action:
await convex.ai.chat.testChatbotData.action()

// Check the output for:
✅ success: true
✅ user data loaded
✅ data counts > 0 for categories with data
✅ Non-empty summary
```

### Option B: Check Console Logs
When chatbot responds, look for these logs:
```
✅ [CHAT] Starting for user: clerk_xyz
✅ [CHAT] Context loaded - User: John | Orders: X | Favorites: Y
✅ [CHAT] Calling GROQ API
✅ [CHAT] GROQ response received
```

Missing logs = Something failed early

---

## 🌐 Step 4: Verify GROQ API

- [ ] **GROQ_API_KEY is set**
  - Check `.env.local` or `.env` file
  - Should have: `GROQ_API_KEY=gsk_...`
  - **Fix**: Add key from GROQ console

- [ ] **GROQ_MODEL is set (optional)**
  - Defaults to: `llama-3.3-70b-versatile`
  - Check if custom model is configured
  - **Fix**: Update `.env.local`

- [ ] **No GROQ API errors in console**
  - Look for: `GROQ API error` or `401/403 Unauthorized`
  - **Fix**: Verify API key is valid

---

## 💬 Step 5: Test Chatbot Message

### Test 1: Simple Question
```
Question: "Hello"
Expected: Friendly greeting + mention of name from profile
Result: ✅ or ❌
```

### Test 2: Order Status
```
Question: "What orders do I have?"
Expected: List of orders with status, items, dates
Result: ✅ or ❌
```

### Test 3: Multi-Topic
```
Question: "Show me my orders, favorites, and points"
Expected: All three categories in response
Result: ✅ or ❌
```

### Test 4: Specific Data
```
Question: "What did I order last?"
Expected: Details of most recent completed order
Result: ✅ or ❌
```

---

## 📋 Step 6: Check Data Pipeline

### Is Context Being Built?
- [ ] Add breakpoint in `buildCustomerContext` (lines in context.ts)
- [ ] Verify user record exists in `users` table
- [ ] Verify branch lookup works (if branchSlug set)

### Is Data Being Loaded?
- [ ] Orders query: Check if orders exist with matching `clerkUserId`
- [ ] Favorites query: Check if items exist with matching `userId`
- [ ] Feedback query: Check if testimonials exist with matching `clerkUserId`
- [ ] Reservations query: Check if reservations exist with matching email

### Is System Prompt Including Data?
- [ ] In chat.ts, after `buildSystemPrompt()` call
- [ ] System prompt length should be 2000+ characters
- [ ] Check if category counts are > 0

---

## 🐛 Step 7: Common Issues & Fixes

### Issue: "I couldn't reach the assistant"
```
❌ Cause 1: GROQ_API_KEY missing
   Fix: Set GROQ_API_KEY in environment

❌ Cause 2: GROQ API rate limit hit
   Fix: Wait a moment, try again

❌ Cause 3: Network error
   Fix: Check internet connection, try again
```

### Issue: "Please log in to your account first"
```
❌ Cause 1: User not authenticated
   Fix: Ensure Clerk login completed

❌ Cause 2: Clerk session expired
   Fix: User should refresh page

❌ Cause 3: Invalid Clerk config
   Fix: Check CLERK_PUBLISHABLE_KEY in .env.local
```

### Issue: "Unable to load your profile"
```
❌ Cause 1: User doesn't exist in users table
   Fix: Ensure syncProfile mutation ran after login

❌ Cause 2: Database query failed
   Fix: Check Convex logs for query errors

❌ Cause 3: Branch lookup failed (non-critical)
   Fix: Set user's branchSlug in profile
```

### Issue: Chatbot doesn't mention orders/favorites/etc
```
❌ Cause 1: Data doesn't exist yet
   Fix: Create some (place order, save favorite, leave review)

❌ Cause 2: Wrong database fields
   Fix: Verify schema matches context.ts queries

❌ Cause 3: Indexes missing or misconfigured
   Fix: Rebuild Convex with: npx convex deploy
```

### Issue: Conversation history not working
```
❌ Cause 1: ThreadId not being passed
   Fix: Ensure chat component stores threadId from response

❌ Cause 2: Messages not being stored
   Fix: Check aiMessages table has entries

❌ Cause 3: History retrieval failed
   Fix: Check getThreadHistory function in messages.ts
```

---

## 🔄 Step 8: System Health Check

Run this checklist weekly:

- [ ] **Database Tables Exist**
  ```
  ✅ users
  ✅ orders
  ✅ userFavorites
  ✅ testimonials
  ✅ reservations
  ✅ coupons
  ✅ aiThreads
  ✅ aiMessages
  ```

- [ ] **Indexes Working**
  ```
  ✅ users.by_clerk
  ✅ orders.by_clerk_created
  ✅ userFavorites.by_user
  ✅ testimonials.by_clerk
  ✅ reservations (by email or date)
  ```

- [ ] **Environment Variables Set**
  ```
  ✅ GROQ_API_KEY
  ✅ CLERK_PUBLISHABLE_KEY (frontend)
  ✅ CLERK_SECRET_KEY (backend if using)
  ```

- [ ] **No Rate Limiting Issues**
  - Check: 10 messages per 60 seconds per user
  - If hit: Clear in next minute window

- [ ] **Logs Clean**
  - No recurring errors in console
  - [CHAT] logs showing expected flow

---

## 📊 Performance Checklist

- [ ] **Chatbot responds in < 3 seconds**
  - If slower: Check GROQ API latency

- [ ] **No memory leaks**
  - Check browser DevTools memory
  - Look for growing array sizes

- [ ] **Conversation history loads quickly**
  - Should load 20 prior messages instantly
  - If slow: Check aiMessages indexes

- [ ] **No N+1 query problems**
  - Each user context load = ~5 queries
  - If more: Check for nested queries in context.ts

---

## 🧪 Testing Scenarios

### Scenario 1: New Customer
```
1. Create account via Clerk
2. No orders yet
3. Chatbot should: Greet + mention no data
4. After first order: Should show in next chat
✅ Works: All steps succeed
❌ Fails: Debug at step 2
```

### Scenario 2: Existing Customer
```
1. Login as customer with data
2. Ask about orders
3. Should list all orders
4. Ask about favorites
5. Should list all favorites
✅ Works: All questions answered
❌ Fails: Debug specific category
```

### Scenario 3: Multi-Turn Conversation
```
1. Ask: "What's my order?"
2. Follow: "How many points did I earn?"
3. Follow: "Show me my favorites"
✅ Works: All questions in context
❌ Fails: Thread history issue
```

### Scenario 4: Rate Limit
```
1. Send 10 messages in 30 seconds
2. Send 11th message
3. Should see: "Too many messages"
4. Wait 60 seconds
5. Send message again
✅ Works: Rate limit enforced then released
❌ Fails: Rate limiting not working
```

---

## 📝 Logging to Add Debugging

If needed, add more granular logging:

```typescript
// In context.ts - Add after each query
console.log(`[CONTEXT] Orders loaded:`, allOrders.length);
console.log(`[CONTEXT] Favorites loaded:`, favourites.length);
console.log(`[CONTEXT] Testimonials loaded:`, testimonials.length);
console.log(`[CONTEXT] Reservations loaded:`, myReservations.length);

// In chat.ts - Add response details
console.log(`[CHAT] Response from GROQ:`, {
  model: groqModel,
  chars: assistantMessage.length,
  firstLine: assistantMessage.split('\n')[0]
});
```

---

## 📞 When to Escalate

If all checks pass but chatbot still not working:

1. **Share diagnostic output**
   ```
   testChatbotData() result
   ```

2. **Share console logs**
   ```
   Look for [CHAT] prefix
   Include timestamps
   ```

3. **Share error message**
   ```
   Exact error text from chatbot
   Screenshot of console error
   ```

4. **Provide context**
   ```
   What question were you asking?
   Does customer have data for that category?
   When did it last work?
   ```

---

## ✅ Debug Complete When:

- ✅ Diagnostic shows all data counts correct
- ✅ Console shows [CHAT] logs for full flow
- ✅ Chatbot responds to test questions
- ✅ Multiple topics tested successfully
- ✅ Rate limiting works
- ✅ No errors in browser console

