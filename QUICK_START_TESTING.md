# Quick Start - Real Provider Testing

## 🚀 Start Server

```bash
cd d:\deepsreach
npm run dev
```

Wait for:
```
🚀 DeepTrust API Server Started
Port: 3000
```

---

## 📝 Step-by-Step Testing

### Step 1: Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\":\"test-device-001\"}"
```

**Save the `appUserId` from response** (e.g., `DTX-X8D6-YVIR`)

---

### Step 2: Test Name Search (Serper Provider)

```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-X8D6-YVIR" \
  -d "{\"searchType\":\"name\",\"nameQuery\":\"Elon Musk\"}"
```

**Save the `search.id` from response**

**Wait 5-10 seconds**, then get results:

```bash
curl http://localhost:3000/api/results/search/SEARCH_ID_HERE \
  -H "x-app-user-id: DTX-X8D6-YVIR"
```

**Expected:**
- Profiles from LinkedIn, Twitter, etc.
- Confidence scores (0-100)
- AI summary with risk assessment
- Platform information

---

### Step 3: Test Username Search

```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-X8D6-YVIR" \
  -d "{\"searchType\":\"username\",\"usernameQuery\":\"@elonmusk\"}"
```

---

### Step 4: Test Image Search (Google Vision)

**First, upload an image:**

```bash
curl -X POST http://localhost:3000/api/uploads \
  -H "x-app-user-id: DTX-X8D6-YVIR" \
  -F "image=@C:\path\to\image.jpg"
```

**Save the `upload.id` from response**

**Then search by image:**

```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-X8D6-YVIR" \
  -d "{\"searchType\":\"photo\",\"imageId\":\"UPLOAD_ID_HERE\"}"
```

**Expected:**
- Image matches from web
- Similarity scores (0-100)
- Pages where image appears
- Image labels (Person, Face, etc.)
- Duplicate image risk assessment

---

### Step 5: Test Mixed Search

```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-X8D6-YVIR" \
  -d "{\"searchType\":\"mixed\",\"nameQuery\":\"Elon Musk\",\"usernameQuery\":\"@elonmusk\"}"
```

---

## 🎯 Windows PowerShell Commands

If using PowerShell, use these instead:

### Create User
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"deviceId":"test-device-001"}'
```

### Name Search
```powershell
$userId = "DTX-X8D6-YVIR"
Invoke-RestMethod -Uri "http://localhost:3000/api/searches" `
  -Method POST `
  -Headers @{
    "Content-Type"="application/json"
    "x-app-user-id"=$userId
  } `
  -Body '{"searchType":"name","nameQuery":"Elon Musk"}'
```

### Get Results
```powershell
$searchId = "YOUR_SEARCH_ID"
Invoke-RestMethod -Uri "http://localhost:3000/api/results/search/$searchId" `
  -Headers @{"x-app-user-id"=$userId}
```

---

## 📊 Expected Response Structure

### Search Creation Response
```json
{
  "success": true,
  "message": "Search created successfully",
  "data": {
    "search": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d7",
      "searchType": "name",
      "nameQuery": "Elon Musk",
      "status": "pending",
      "progress": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Result Response (After Processing)
```json
{
  "success": true,
  "data": {
    "result": {
      "summary": {
        "totalProfilesFound": 5,
        "totalImageMatches": 0,
        "overallConfidence": 85,
        "summaryText": "Found 5 potential profiles for \"Elon Musk\".",
        "hasResults": true
      },
      "matchedProfiles": [
        {
          "platform": "LinkedIn",
          "username": "elonmusk",
          "profileUrl": "https://linkedin.com/in/elonmusk",
          "displayName": "Elon Musk",
          "bio": "CEO of Tesla and SpaceX",
          "confidence": 95,
          "isVerified": false
        }
      ],
      "imageMatches": [],
      "imageLabels": [],
      "flags": [
        {
          "type": "info",
          "category": "Multi-Platform Presence",
          "message": "Profiles found across 3 different platforms",
          "severity": "low"
        }
      ],
      "aiAnalysis": {
        "identityConfidence": 85,
        "riskLevel": "low",
        "riskFlags": ["Multi-platform presence detected"],
        "summary": "Found 5 profiles across 3 platforms. 2 verified accounts detected.",
        "platformsFound": ["LinkedIn", "Twitter", "GitHub"],
        "duplicateImageRisk": false,
        "recommendations": [
          "Review all profiles for consistency",
          "Check for verified accounts"
        ]
      }
    }
  }
}
```

---

## ✅ Success Indicators

### 1. Serper Working
- Profiles returned with platform names
- Confidence scores present
- Profile URLs valid
- Bio/description included

### 2. Google Vision Working
- Image matches found
- Similarity scores present
- Page URLs included
- Labels extracted

### 3. OpenRouter Working
- AI analysis present
- Identity confidence calculated
- Risk level assigned
- Recommendations provided

---

## 🐛 Troubleshooting

### No Results After 10 Seconds

**Check search status:**
```bash
curl http://localhost:3000/api/searches/SEARCH_ID \
  -H "x-app-user-id: DTX-X8D6-YVIR"
```

Look for `status` field:
- `pending` - Still processing
- `processing` - In progress
- `completed` - Done
- `failed` - Error occurred

### Check Logs

```bash
# View recent logs
tail -f dev_output.log

# Search for errors
grep "error" dev_output.log

# Check provider calls
grep "Serper" dev_output.log
grep "Google Vision" dev_output.log
grep "OpenRouter" dev_output.log
```

### Verify API Keys

```bash
# Check if keys are loaded
curl http://localhost:3000/api/health
```

Server should start without errors.

---

## 📱 Postman Quick Import

Create a new collection with these requests:

**Variables:**
- `baseUrl`: `http://localhost:3000/api`
- `userId`: (set after creating user)
- `searchId`: (set after creating search)

**Requests:**

1. **Create User**
   - POST `{{baseUrl}}/users`
   - Body: `{"deviceId":"test-001"}`

2. **Name Search**
   - POST `{{baseUrl}}/searches`
   - Headers: `x-app-user-id: {{userId}}`
   - Body: `{"searchType":"name","nameQuery":"Elon Musk"}`

3. **Get Result**
   - GET `{{baseUrl}}/results/search/{{searchId}}`
   - Headers: `x-app-user-id: {{userId}}`

---

## 🎯 Test Scenarios

### Scenario 1: Famous Person
```json
{
  "searchType": "name",
  "nameQuery": "Elon Musk"
}
```
**Expected:** Multiple profiles, high confidence

### Scenario 2: Common Name
```json
{
  "searchType": "name",
  "nameQuery": "John Smith"
}
```
**Expected:** Many profiles, varied confidence

### Scenario 3: Unique Username
```json
{
  "searchType": "username",
  "usernameQuery": "@github"
}
```
**Expected:** Platform-specific results

### Scenario 4: Profile Image
Upload a profile photo, then search
**Expected:** Image matches, identity labels

---

## ⏱️ Timing Expectations

- **Search Creation:** < 1 second
- **Name Search Processing:** 3-8 seconds
- **Image Search Processing:** 5-15 seconds
- **Mixed Search Processing:** 8-20 seconds
- **Result Retrieval:** < 1 second

---

## 🎉 Success!

If you see:
- ✅ Profiles with real data
- ✅ Confidence scores
- ✅ AI analysis
- ✅ Risk assessment
- ✅ No errors in logs

**Your integration is working perfectly!**

---

## 📞 Need Help?

1. Check `REAL_PROVIDER_TESTING_GUIDE.md` for detailed info
2. Review `REAL_PROVIDER_IMPLEMENTATION.md` for architecture
3. Check logs: `dev_output.log`
4. Verify API keys in `.env`
5. Ensure server is running on port 3000

---

**Ready to test? Start with Step 1!**
