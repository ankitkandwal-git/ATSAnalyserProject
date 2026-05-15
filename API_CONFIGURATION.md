# 🚀 ATS Analyzer - API Configuration & Testing Guide

## ✅ Production Configuration Status

### Backend Deployment
- **URL:** https://atsanalyserproject.onrender.com
- **Status:** ✅ Configured
- **CORS Origins:** http://localhost:3000, http://localhost:5173 (development)

### Frontend Configuration
- **API Base URL:** https://atsanalyserproject.onrender.com
- **Environment Variable:** VITE_API_URL
- **Status:** ✅ Updated

---

## 📡 Complete API Endpoint Reference

### Base URL: `https://atsanalyserproject.onrender.com`

| Endpoint | Method | Frontend Call | Purpose |
|----------|--------|---------------|---------|
| `/auth/register` | POST | `${API_URL}/auth/register` | User registration |
| `/auth/login` | POST | `${API_URL}/auth/login` | User login |
| `/api/resumes/upload` | POST | `${API_URL}/api/resumes/upload` | Upload resume PDF |
| `/api/resumes/analyze` | POST | `${API_URL}/api/resumes/analyze` | Analyze resume text |

---

## 🧪 Test All Endpoints (Manual cURL Commands)

### 1. Test Registration
```bash
curl -X POST https://atsanalyserproject.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```
**Expected Response:** `{ token, name, email }`

### 2. Test Login
```bash
curl -X POST https://atsanalyserproject.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```
**Expected Response:** `{ token }`

### 3. Test Server Health
```bash
curl https://atsanalyserproject.onrender.com/
```
**Expected Response:** `Welcome to ATS Analyzer API`

---

## 📂 Files Modified

1. **Frontend .env**
   - ✅ Updated `VITE_API_URL=https://atsanalyserproject.onrender.com`

2. **Backend .env**
   - ✅ Added `FRONTEND_URL=http://localhost:3000,http://localhost:5173`

3. **Backend .env.production** (created)
   - ✅ Production-ready configuration template

---

## 🔍 Current Frontend Implementation

### Register Component (`register.jsx`)
- ✅ Uses: `${API_URL}/auth/register`
- ✅ Payload: `{ name, email, password }`
- ✅ Success: Stores token in localStorage

### Login Component (`login.jsx`)
- ✅ Uses: `${API_URL}/auth/login`
- ✅ Payload: `{ email, password }`
- ✅ Success: Stores token in localStorage

### Resume Analysis (`analyseService.js`)
- ✅ Upload: `${API_URL}/api/resumes/upload`
- ✅ Analyze: `${API_URL}/api/resumes/analyze`

---

## 🚨 Troubleshooting

### If you still see 404 NOT_FOUND:
1. Check network tab in browser DevTools
2. Verify exact URL being called
3. Ensure backend is running on Render
4. Clear browser cache (Ctrl+Shift+Delete)

### If you see CORS error:
1. Backend needs FRONTEND_URL set in .env
2. ✅ Already configured in this update

### If token not saving:
1. Check localStorage in browser DevTools
2. Verify response includes `token` field

---

## 📋 Deployment Checklist

- [x] Backend deployed on Render
- [x] Frontend .env configured with correct API URL
- [x] CORS properly configured
- [x] All route paths match backend
- [ ] Test registration flow end-to-end
- [ ] Test login flow end-to-end
- [ ] Test resume upload and analysis
- [ ] Verify token persistence
- [ ] Check production frontend deployment

---

## 🎯 Next Steps

1. **Test Locally First:**
   ```bash
   cd Backend && node server.js
   cd frontend && npm run dev
   ```

2. **Test Each Endpoint:**
   - Register with test account
   - Login with test account
   - Upload resume
   - Analyze resume

3. **Deploy Frontend:**
   - Build: `npm run build`
   - Deploy to Vercel
   - Add backend URL to Vercel environment variables

---

## 💡 Important Notes

- API_URL is stripped of trailing slashes: `.replace(/\/$/, '')`
- Token is stored in localStorage under key: `token`
- All requests are made with axios or fetch
- CORS is enabled for specified origins only in production

