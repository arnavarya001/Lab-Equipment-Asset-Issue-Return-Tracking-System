# Lab Equipment & Asset Issue-Return Tracking System (PS 8)

> **College Assignment-2 Project**  
> **Problem Statement 8**: Institutional Asset Management — Equipment Issue & Return Tracking System  
> **Tech Stack**: Node.js, Express.js, MongoDB Atlas, EJS (Server-Side Rendering), Vanilla CSS

---

## 📌 1. Project Overview

In educational institutions and engineering laboratories, high-value laboratory equipment (oscilloscopes, laptops, microcontrollers, projectors, sensors) is constantly borrowed by students, researchers, and faculty. Managing these checkouts using physical paper logbooks leads to lost equipment, stock discrepancies, and missed returns.

This web application provides a computerized **Issue-Return Tracking System** that:
1. **Centralizes Inventory**: The **Admin** tracks all physical assets with unique tags, categories, locations, conditions, and stock counts.
2. **Prevents Over-Issuing**: Built-in backend validations guarantee that students/staff cannot borrow more units than are physically available on shelves (`requestedQuantity <= availableQuantity`).
3. **Formal Handover & Return Lifecycle**: The **Lab In-charge** approves requests, formally issues items (which decrements available stock), and logs returns while inspecting return condition (`OK`, `Damaged`, or `Lost`).
4. **Automated Overdue Tracking**: The system dynamically flags active borrowings that have passed their expected return date.
5. **Real-Time Analytics**: An interactive dashboard displays live database metrics (Total Assets, Units Owned, Available Units, Currently Issued, Overdue Checkouts, Damaged/Lost Items).

---

## 👥 2. User Roles & Capabilities

| Role | Responsibilities | Key Pages |
| :--- | :--- | :--- |
| **Requester** *(Student / Staff)* | • Register & log in<br>• Browse catalog of available lab equipment<br>• Submit borrow requests with intended purpose & expected return date<br>• Track request status (`Pending` &rarr; `Approved` &rarr; `Issued` &rarr; `Returned`) | `/requester/dashboard`<br>`/requester/equipment`<br>`/requester/requests` |
| **Lab In-charge** | • Review incoming request queue<br>• Approve or reject requests<br>• Hand over & issue equipment (decreases available stock)<br>• Process returns, inspect condition (`OK`, `Damaged`, `Lost`), and update inventory | `/lab-incharge/dashboard`<br>`/lab-incharge/requests`<br>`/lab-incharge/returns` |
| **Admin** | • Full CRUD over institutional assets<br>• Monitor lab-wide statistics and overdue returns<br>• Record maintenance/service logs (stretch feature) | `/admin/dashboard`<br>`/admin/assets`<br>`/admin/assets/add`<br>`/admin/assets/edit/:id` |

---

## 🛠️ 3. Mandatory Tech Stack & Architecture

* **Frontend**: EJS (Embedded JavaScript) Server-Side Rendering + Vanilla CSS + Vanilla JS
* **Backend**: Node.js & Express.js (MVC Pattern)
* **Database**: MongoDB Atlas (via Mongoose ODM)
* **Authentication**: Session-based (`express-session` + `connect-mongo` + `bcryptjs`)
* **Deployment**: Render-ready with environment variables

---

## 📁 4. Project Folder Structure

```text
lab-equipment-system/
├── models/
│   ├── User.js             # User schema with roles (requester, lab-incharge, admin)
│   ├── Asset.js            # Asset schema (tags, category, total & available quantity)
│   └── Request.js          # Request schema (lifecycle, timestamps, overdue virtual)
├── routes/
│   ├── auth.js             # Register, login, logout, role redirection
│   ├── admin.js            # Asset CRUD, metrics calculation, maintenance log
│   ├── requester.js        # Catalog browsing, request submission, history
│   └── labIncharge.js      # Approval queue, equipment issue, return processing
├── middleware/
│   └── auth.js             # Route guards (isLoggedIn, isAdmin, isLabIncharge, isRequester)
├── views/
│   ├── partials/
│   │   ├── header.ejs      # Responsive navbar with dynamic role pills
│   │   ├── footer.ejs      # Standard footer
│   │   └── messages.ejs    # Flash alert banners (success / error)
│   ├── auth/
│   │   ├── login.ejs       # Clean login interface
│   │   └── register.ejs    # Registration with role selector for testing
│   ├── admin/
│   │   ├── dashboard.ejs   # Real MongoDB aggregated statistics
│   │   ├── assets.ejs      # Complete asset inventory table
│   │   ├── addAsset.ejs    # Asset creation form
│   │   └── editAsset.ejs   # Asset editor + maintenance logging
│   ├── requester/
│   │   ├── dashboard.ejs   # Student personal metrics & overdue alerts
│   │   ├── equipment.ejs   # Real-time catalog of available equipment
│   │   ├── newRequest.ejs  # Equipment borrow form with quantity guard
│   │   └── requests.ejs    # Request history with status badges
│   └── labIncharge/
│       ├── dashboard.ejs   # Queue stats, active checkouts, overdue list
│       ├── requests.ejs    # Request approvals & issue trigger
│       └── returns.ejs     # Return recorder with OK/Damaged/Lost conditions
├── public/
│   ├── css/
│   │   └── style.css       # Clean, modern Vanilla CSS
│   └── js/
│       └── main.js         # Client-side input & date validation helpers
├── seed.js                 # Sample database seeder for demo & viva
├── test_system.js          # Automated end-to-end test suite
├── app.js                  # Main server setup & database connection
├── package.json
└── .env.example
```

---

## ⚡ 5. Quick Start (Local Setup)

### Step 1: Clone the Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd lab-equipment-system
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root folder (or copy from `.env.example`):
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/lab_equipment_db
SESSION_SECRET=college_lab_secret_key_2026
NODE_ENV=development
```

### Step 4: Seed Sample Data (Viva / Demo Ready)
Run the built-in database seeder to populate sample assets, users, and scenarios:
```bash
npm run seed
```

This creates 3 ready-to-use demo accounts:
* **Admin**: `admin@college.edu` | Password: `password123`
* **Lab In-charge**: `incharge@college.edu` | Password: `password123`
* **Requester (Student)**: `student@college.edu` | Password: `password123`

### Step 5: Start the Application
```bash
npm start
```
Open your browser and visit: **`http://localhost:3000`**

### Step 6: Run Automated Tests
```bash
node test_system.js
```
*(Executes 20 end-to-end integration tests verifying authentication, role security, inventory math, and return conditions).*

---

## 🌐 6. How to Set Up MongoDB Atlas (Cloud Database)

1. Go to **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** and create a free account.
2. Click **Create a Deployment** and select the **M0 Free Shared Tier**.
3. Under **Security & Access**:
   * **Database Access**: Create a database user with username and password (e.g. `labAdmin` and a secure password). Remember these credentials.
   * **Network Access**: Click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`) so your Render cloud server can connect.
4. Click **Database** &rarr; **Connect** &rarr; **Drivers** (Node.js).
5. Copy your connection string. It will look like:
   ```text
   mongodb+srv://labAdmin:<password>@cluster0.xxxx.mongodb.net/lab_equipment_db?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your database user password, and set this string as `MONGO_URI` in your `.env` file.

---

## 🚀 7. Deployment Guide (Render)

1. Push your repository to **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Lab Equipment Tracking System"
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git branch -M main
   git push -u origin main
   ```
2. Log in to **[Render.com](https://render.com)**.
3. Click **New +** &rarr; **Web Service**.
4. Connect your GitHub repository.
5. Configure settings:
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
6. Add **Environment Variables** in the Render dashboard:
   * `MONGO_URI`: *(Your MongoDB Atlas connection string)*
   * `SESSION_SECRET`: *(A random string of characters)*
   * `NODE_ENV`: `production`
7. Click **Deploy Web Service**.
8. Once deployment finishes, Render will provide a live production URL:  
   `https://<your-project-name>.onrender.com`

---

## 🎓 8. Viva & Demo Questions & Answers

### Q1: Why did you use EJS Server-Side Rendering instead of React?
> **Answer**: EJS renders HTML directly on the server before dispatching it to the browser. For an institutional internal application, SSR simplifies the architecture by eliminating the need for a separate frontend build process, state management libraries, and CORS configuration. It also allows session authentication to be tied seamlessly to HTTP requests.

### Q2: Why did you choose session-based authentication over JWT?
> **Answer**: In server-side rendered applications, session-based authentication with `express-session` and `connect-mongo` is both simpler and more secure. The session data is stored on the server in MongoDB, and the client only holds an encrypted, HTTP-only cookie. This prevents XSS attacks from stealing credentials from `localStorage`, and allows the server to immediately invalidate a session on logout.

### Q3: How does your system prevent issuing more equipment than is available?
> **Answer**: We enforce stock verification on the backend Express routes:
> ```javascript
> if (request.quantity > asset.availableQuantity) {
>   req.flash('error', 'Not enough equipment available.');
>   return res.redirect('/lab-incharge/requests');
> }
> ```
> This prevents over-issuing even if someone attempts to tamper with the frontend form.

### Q4: How is an overdue item identified?
> **Answer**: In our Mongoose `Request` schema, we implemented a virtual property `isOverdue`:
> ```javascript
> requestSchema.virtual('isOverdue').get(function () {
>   if (this.status === 'Issued' && this.expectedReturnDate) {
>     return new Date() > new Date(this.expectedReturnDate);
>   }
>   return false;
> });
> ```
> If the item is currently in `Issued` status and the current date is greater than `expectedReturnDate`, the system flags it as overdue on the dashboard and tables.

### Q5: What happens when an item is returned as "Damaged" or "Lost"?
> **Answer**: 
> * If condition is **`OK`**: The returned quantity is safely added back to `availableQuantity` (`availableQuantity += returnedQuantity`).
> * If condition is **`Damaged`**: The items are unusable for other students, so `availableQuantity` is **not** increased. The asset condition is flagged as Damaged.
> * If condition is **`Lost`**: The units are missing permanently. Total `quantity` is reduced (`quantity -= lostQuantity`), and `availableQuantity` is not increased.

---

## 📜 Submission Checklist
- [x] Complete source code on GitHub
- [x] Working production URL deployed on Render
- [x] Presentation PPT uploaded to Google Drive (*Anyone with the link &rarr; Viewer*)
- [x] 5-10 minute Demo Video uploaded to Google Drive (*Anyone with the link &rarr; Viewer*)
