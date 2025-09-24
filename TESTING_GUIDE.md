# 🧪 Testing Guide - Enhanced Miami Alter Ego App

## 🚀 **Quick Start Testing**

### **1. Start Development Server**
```bash
cd miami-reunion-app
npm run dev
```

### **2. Open in Browser**
Navigate to `http://localhost:5173`

---

## 🔧 **Environment Testing Levels**

### **Level 1: Basic Testing (No API Keys)**
Test core functionality with mock services:
```bash
# In .env file:
VITE_ENABLE_ENHANCED_GENERATION=false
# Leave API keys empty - app will use mock modes
```

### **Level 2: Enhanced Testing (With API Keys)**
Test full functionality with real services:
```bash
# In .env file:
VITE_ENABLE_ENHANCED_GENERATION=true
VITE_FAL_AI_KEY=your_fal_ai_key
VITE_PRINTFUL_API_KEY=your_printful_key
VITE_N8N_WEBHOOK_URL=your_webhook_url
```

---

## 📋 **Manual Testing Checklist**

### **🎯 Core App Flow Testing**

#### **Step 1: Name Entry & Gender Selection**
- [ ] Enter name and verify member lookup
- [ ] See gender selection screen (if enabled)
- [ ] Test all gender options: Masculine, Feminine, Show All
- [ ] Verify style filtering based on selection

#### **Step 2: Image Upload**
- [ ] Upload a clear photo (JPEG/PNG)
- [ ] Verify image preview appears
- [ ] Test "Different Photo" button
- [ ] Try various image sizes and formats

#### **Step 3: Generation Testing**
- [ ] Click "Generate Miami Styles"
- [ ] Verify loading states on all cards
- [ ] Check generation completes for all styles
- [ ] Test error handling (disconnect internet briefly)

### **⚙️ Enhanced Features Testing**

#### **Settings Panel**
- [ ] Click ⚙️ Settings button (top-left)
- [ ] Toggle "Enhanced Generation" on/off
- [ ] Verify API status indicators show correct states
- [ ] Test gender selection reset
- [ ] Check version information

#### **Gender-Aware Styles**
- [ ] Select "Masculine" → verify m1-m5 styles generated
- [ ] Select "Feminine" → verify f1-f5 styles generated  
- [ ] Select "Show All" → verify all styles generated
- [ ] Test switching between gender preferences

#### **Multi-Provider AI**
- [ ] Enable enhanced generation
- [ ] Generate party themes (Strip Club Owner, Beach Gigolo)
- [ ] Check console logs for "Using SeeDream" messages
- [ ] Generate professional themes (Drug Lord, Sugar Daddy)
- [ ] Check console logs for "Using Gemini" messages

#### **Image Format Processing**
- [ ] Generate with enhanced mode enabled
- [ ] Open browser DevTools → Network tab
- [ ] Verify multiple image formats created
- [ ] Check image quality and processing

### **🛍️ Commerce Features Testing**

#### **Product Creation (Mock Mode)**
- [ ] Generate image with enhanced mode
- [ ] Check console for "products created" messages
- [ ] Verify mock product data structure

#### **Product Creation (Real Printful)**
```bash
# With VITE_PRINTFUL_API_KEY set:
```
- [ ] Generate image
- [ ] Check Printful dashboard for new products
- [ ] Verify 3 products created (t-shirt, mug, poster)
- [ ] Test product naming and descriptions

### **🔗 Webhook Testing**

#### **Webhook Triggers (Mock Mode)**
- [ ] Enable enhanced generation
- [ ] Generate image
- [ ] Check console for webhook events:
  - `image_generated`
  - `products_created`

#### **Real N8n Webhook Testing**
```bash
# With VITE_N8N_WEBHOOK_URL set:
```
- [ ] Set up test N8n workflow
- [ ] Generate image
- [ ] Check N8n execution logs
- [ ] Verify webhook payload structure

---

## 🔍 **Developer Testing Tools**

### **Browser Console Commands**
Open DevTools Console and try these:

```javascript
// Test service manager
serviceManager.getHealthStatus().then(console.log);

// Test webhook service
webhookService.testWebhook().then(console.log);

// Test image generation service  
imageGenerationService.getProviderMetrics();

// Test commerce service
printfulCommerceService.getAvailableProducts().then(console.log);
```

### **Network Monitoring**
1. Open DevTools → Network tab
2. Generate images
3. Look for:
   - Gemini API calls
   - fal.ai API calls (if enabled)
   - Printful API calls (if enabled)
   - N8n webhook calls (if enabled)

### **Local Storage Inspection**
Check for proper state management:
```javascript
// Check stored user data
console.log(localStorage.getItem('miami-user-session'));

// Check feature flags
console.log(localStorage.getItem('enhanced-features'));
```

---

## 🧪 **Automated Testing Setup**

### **Unit Testing with Vitest**
```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Run tests
npm run test
```

### **Create Test Files**
```typescript
// src/services/__tests__/ImageGenerationService.test.ts
// src/services/__tests__/PrintfulCommerceService.test.ts  
// src/services/__tests__/WebhookService.test.ts
// src/components/__tests__/GenderSelection.test.tsx
```

---

## 🔧 **Performance Testing**

### **Bundle Size Analysis**
```bash
# Build and analyze
npm run build
npx vite-bundle-analyzer dist
```

### **Load Testing**
```bash
# Install lighthouse
npm install -g lighthouse

# Test performance
lighthouse http://localhost:5173 --view
```

### **Memory Usage**
1. Open DevTools → Performance tab
2. Start recording
3. Generate multiple images
4. Check memory usage patterns

---

## 🐛 **Common Issues & Solutions**

### **Image Generation Fails**
```bash
# Check API keys
echo $VITE_GEMINI_API_KEY
echo $VITE_FAL_AI_KEY

# Check network connectivity
curl -I https://generativelanguage.googleapis.com
```

### **Commerce Features Not Working**
```bash
# Verify Printful API key
curl -H "Authorization: Bearer $VITE_PRINTFUL_API_KEY" https://api.printful.com/products
```

### **Webhooks Not Firing**
```bash
# Test webhook endpoint
curl -X POST $VITE_N8N_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### **Build Issues**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📊 **Test Data Scenarios**

### **Test Photos**
Use these types of photos for comprehensive testing:
- [ ] Clear headshot (ideal case)
- [ ] Group photo (test face detection)
- [ ] Low quality image (test enhancement)
- [ ] Very large image (test processing)
- [ ] Different orientations (portrait/landscape)

### **Test Names**
- [ ] Real fraternity member name
- [ ] Non-member name (test fallback)
- [ ] Special characters in name
- [ ] Very long name
- [ ] Empty name (error handling)

### **API Limit Testing**
- [ ] Generate multiple images quickly (rate limiting)
- [ ] Test with expired API keys
- [ ] Test with invalid API keys
- [ ] Test network timeouts

---

## ✅ **Success Criteria**

### **Basic Functionality**
- [ ] All 5 Miami styles generate successfully
- [ ] Images display correctly in polaroid cards
- [ ] Gallery saving works
- [ ] Download functionality works
- [ ] Mobile responsive design

### **Enhanced Features**
- [ ] Gender selection filters styles correctly
- [ ] Multi-provider AI selects optimal provider
- [ ] Image processing creates all format variants
- [ ] Commerce integration creates products
- [ ] Webhooks fire with correct payloads

### **Performance**
- [ ] Initial page load < 3 seconds
- [ ] Image generation < 15 seconds per style
- [ ] No memory leaks during extended use
- [ ] Responsive on mobile devices

### **Error Handling**
- [ ] Graceful fallbacks when APIs fail
- [ ] User-friendly error messages
- [ ] Retry mechanisms work correctly
- [ ] App doesn't crash on errors

---

## 🎯 **Ready to Test!**

Start with Level 1 testing (no API keys) to verify core functionality, then progress to Level 2 with your configured .env file for full feature testing.

**Testing order:**
1. 🏃‍♂️ **Quick Start**: `npm run dev` → basic flow
2. ⚙️ **Settings Panel**: Test feature toggles
3. 👥 **Gender Selection**: Test style filtering  
4. 🤖 **Enhanced Generation**: Test multi-provider AI
5. 🛍️ **Commerce**: Test product creation
6. 🔗 **Webhooks**: Test automation triggers

**Happy Testing!** 🎉
