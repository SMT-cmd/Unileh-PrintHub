# Unilesh Print Hub (powered by AfriNet Hub)

A production-ready, full-stack Progressive Web App (PWA) designed for students of the University of Ilesha (Unilesa). This platform provides seamless print-on-demand services, student portal assistance, and real-time campus news and advertisements.

## 🚀 Features

### For Students
- **Print-on-Demand:** Upload PDF, DOCX, or images via Appwrite Storage. Real-time price calculation (B&W vs Color).
- **Portal Assistance:** Secure submission of portal login issues, exam card retrieval, and result checking requests.
- **Real-time News Ticker:** Scrolling marquee for urgent school updates.
- **Latest News & Partners:** Dedicated pages for detailed platform announcements and trusted student service partners.
- **Secure Payments:** Integrated flow for bank transfer confirmation and receipt upload.
- **PWA Ready:** Installable on Android and iOS for offline access to static content.

### For Admin
- **Secure Dashboard:** Protected by Firebase Authentication.
- **Order Management:** Real-time tracking of print orders with "Print Ready" and "Collected" status toggles.
- **Automated Notifications:** Native WhatsApp notifications when orders are ready for collection.
- **Daily Accounting:** Real-time calculation of daily earnings from collected orders.
- **Smart Deletion:** Automatic cleanup of physical files from Appwrite when orders are deleted.
- **Content Manager:** Create and schedule advertisement banners and scrolling announcements.
- **Partner Manager:** Add and manage trusted partners with logos and contact links.

## 🛠️ Tech Stack
- **Frontend:** Vanilla HTML5, CSS3 (Mobile-first), JavaScript (ES6 Modules).
- **Backend/Database:** Firebase Firestore (Real-time).
- **Authentication:** Firebase Auth (Email/Password).
- **File Management:** Appwrite Storage (Centralized Utility).
- **PWA:** Service Workers, Web App Manifest.
- **Notifications:** WhatsApp API Integration.

## 📂 Directory Structure
```
ilesha-print-hub/
├── admin/                  # Admin-only pages
│   ├── js/                 # Auth and Dashboard logic
│   ├── dashboard.html      # Management interface
│   └── index.html          # Admin login
├── assets/
│   ├── css/                # style.css (Public), admin.css (Private)
│   ├── js/                 # database.js, storageService.js, app.js
│   └── images/             # Branding and UI icons
├── index.html              # Landing Page
├── order.html              # Print Order Form
├── checkout.html           # Payment Summary
├── portal.html             # Student Portal Assistance
├── news.html               # Platform Announcements
├── partners.html           # Trusted Partners
├── legal pages             # privacy, terms, refund, about
├── manifest.json           # PWA Configuration
└── service-worker.js       # Offline Caching
```

## ⚙️ Setup & Deployment

### 1. Prerequisites
- Node.js installed.
- A Firebase project created at [console.firebase.google.com](https://console.firebase.google.com).
- An Appwrite project with a storage bucket configured.

### 2. Configuration
Update the following placeholders in the code:
- **Firebase Config:** In `assets/js/database.js`.
- **Appwrite Config:** In `assets/js/storageService.js`.
- **Contact Info:** Update `YOUR_CONTACT_EMAIL` and `YOUR_LOCATION` in legal pages.

### 3. Deployment

#### Option A: GitHub Pages (Recommended for this project)
1. Commit your latest changes:
   ```bash
   git add .
   git commit -m "Update admin dashboard and security rules"
   ```
2. Push your code to GitHub:
   ```bash
   git push origin main
   ```
3. In your GitHub repository settings (**SMT-cmd/Unileh-PrintHub**), go to **Settings > Pages** and set the source to the **main** branch (root folder).
4. Your site will be available at: [unileh-printhub.github.io/Unileh-PrintHub/](https://SMT-cmd.github.io/Unileh-PrintHub/) (or your custom domain if configured).

#### Option B: Firebase Hosting
Install Firebase Tools and deploy:
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

> **IMPORTANT:** Regardless of where you host the frontend (GitHub Pages or Firebase), you **MUST** deploy the Firestore security rules using the Firebase CLI:
> ```bash
> firebase deploy --only firestore:rules
> ```

## 🔒 Security
- **Firestore Rules:** Configured in `firestore.rules` to allow public submissions while restricting data reading/writing to authenticated admins only.
- **Data Privacy:** Portal passwords are used for session-based assistance and are explicitly excluded from permanent storage where possible.

## 📄 License
Owned and operated by **AfriNet Hub**. All rights reserved. Serving the University of Ilesha community.

---
**Domain:** [unilesaservices.com.ng](https://unilesaservices.com.ng)  
**Admin Contact:** +2348083964600
