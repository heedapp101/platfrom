# 🎯 Quick Reference - API Configuration

## 📍 Config File Location
```
platform/src/config/api.js
```

## ⚡ Change Port in ONE Place
```javascript
// platform/src/config/api.js (line 4)
export const API_BASE_URL = "http://localhost:8081/api";
//                                          ↑↑↑↑
//                                    Change this
```

## 📋 All Files Updated

✅ `platform/src/pages/admin/Dashboard.jsx`
✅ `platform/src/pages/admin/Approvals.jsx`
✅ `platform/src/pages/admin/Users.jsx`
✅ `platform/src/pages/auth/Login.jsx`
✅ `platform/src/pages/seller/Dashboard.jsx`
✅ `platform/src/pages/seller/Posts.jsx`

**Before**: 6+ hardcoded URLs
**Now**: 0 hardcoded URLs (all use `API_ENDPOINTS`)

## 🔗 Available Endpoints

### Admin
```javascript
API_ENDPOINTS.ADMIN.STATS              // /admin/stats
API_ENDPOINTS.ADMIN.APPROVALS          // /admin/approvals
API_ENDPOINTS.ADMIN.APPROVE(id)        // /admin/approve/:id
API_ENDPOINTS.ADMIN.REJECT(id)         // /admin/reject/:id
API_ENDPOINTS.ADMIN.USERS(params)      // /admin/users?...
```

### Auth
```javascript
API_ENDPOINTS.AUTH.LOGIN               // /auth/login
API_ENDPOINTS.AUTH.SIGNUP              // /auth/signup
```

### Seller
```javascript
API_ENDPOINTS.SELLER.STATS             // /images/seller/stats
API_ENDPOINTS.SELLER.POSTS             // /images/posts/me
```

### Images
```javascript
API_ENDPOINTS.IMAGES.ALL               // /images
```

## 💻 Usage Example

```javascript
import { API_ENDPOINTS } from "../../config/api";

// Simple endpoint
const res = await fetch(API_ENDPOINTS.ADMIN.STATS, {
  headers: { Authorization: `Bearer ${token}` },
});

// Dynamic endpoint with ID
const res = await fetch(API_ENDPOINTS.ADMIN.APPROVE(userId), {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}` },
});

// Endpoint with params
const res = await fetch(API_ENDPOINTS.ADMIN.USERS(`?role=business`), {
  headers: { Authorization: `Bearer ${token}` },
});
```

## ✨ No More Hardcoded URLs!

**Before**:
```javascript
❌ "http://localhost:5000/api/admin/stats"
❌ "http://localhost:5000/api/auth/login"
❌ "http://localhost:5000/api/images/seller/stats"
```

**After**:
```javascript
✅ API_ENDPOINTS.ADMIN.STATS
✅ API_ENDPOINTS.AUTH.LOGIN
✅ API_ENDPOINTS.SELLER.STATS
```

---

**Status**: ✅ Ready to use - Change port anytime!
