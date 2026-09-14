# 5–10 Minute Demo Video Script & Recording Guide
## PS 8: Lab Equipment & Asset Issue-Return Tracking System

Use this timestamped walkthrough to record your 5–10 minute screen demonstration for Assignment-2.

---

### ⏱️ Segment 1: Introduction (0:00 – 1:00)
* **On Screen**: Start on the project landing / login page (`http://localhost:3000/login`).
* **What to Say**:
  > *"Hello everyone and respected evaluator. Today I am demonstrating my Assignment-2 project for Problem Statement 8: Lab Equipment & Asset Issue-Return Tracking System.  
  > In college laboratories, tracking instruments like oscilloscopes, microcontrollers, and laptops on paper registers often leads to missing inventory, stock discrepancies, and untracked overdue returns.  
  > This full-stack web application is built using Node.js, Express, MongoDB Atlas, EJS for server-side rendering, and session-based authentication. It provides three distinct user roles: Requester (Students/Staff), Lab In-charge, and Administrator."*

---

### ⏱️ Segment 2: Authentication & Role-Based Access (1:00 – 2:00)
* **On Screen**: Click **Register**, show the registration form with role selection, then navigate back to **Login**.
* **What to Say**:
  > *"User authentication uses secure session cookies with MongoDB session persistence, and passwords are encrypted using bcryptjs. The system enforces strict role-based access control.  
  > For instance, a student cannot access the Admin asset management page or approve requests.  
  > Let's start by logging in with our Administrator account: `admin@college.edu`."*

---

### ⏱️ Segment 3: Admin Module & Asset Management (2:00 – 3:30)
* **On Screen**: Log in as Admin. Walk through `/admin/dashboard`, then click **All Assets**, click **+ Add Asset**, fill out a new asset, save it, and show the edit screen with the maintenance log.
* **What to Say**:
  > *"Once logged in as Admin, we are automatically redirected to the Admin Dashboard. Here we see live aggregated metrics calculated directly from MongoDB: Total Assets, Total Owned Units, Available Units, Issued Units, Overdue Returns, and Damaged items.  
  > Notice the overdue alert banner highlighting equipment that has passed its return deadline.  
  > In the 'All Assets' page, the Admin has full CRUD capabilities. Let's add a new asset: a 'Spectrophotometer' with tag 'SPEC001' in Chemistry Lab 1, with a quantity of 6.  
  > When we save it, the system automatically sets available quantity to 6.  
  > If we click 'Edit', we can adjust stock numbers or record maintenance logs with service dates and repair costs as part of our stretch goal."*

---

### ⏱️ Segment 4: Requester Module (3:30 – 5:00)
* **On Screen**: Click **Logout**. Log in as Student (`student@college.edu`). Show the Requester Dashboard, click **Browse Available Equipment**, click **Request This Item** on an asset.
* **What to Say**:
  > *"Now let's log in as a Requester: `student@college.edu`. We land on the Requester Dashboard showing personal borrowing metrics.  
  > Clicking 'Browse Available Equipment' opens our catalog, which dynamically filters to show only equipment that has available stock on the shelf.  
  > Let's test the over-issue prevention: if an asset has 4 units available and I try to request 10 units, both the client form and our backend validation prevent the submission.  
  > Now, let's enter a valid quantity of 1 unit, enter our purpose — 'Final Year Robotics Demonstration', select a valid future return date, and submit.  
  > The request is created with initial status 'Pending', and we are taken to 'My Requests' where we can track its status."*

---

### ⏱️ Segment 5: Lab In-charge Module & Lifecycle (5:00 – 7:00)
* **On Screen**: Click **Logout**. Log in as Lab In-charge (`incharge@college.edu`). Show the dashboard, go to **Requests Queue**, click **Approve**, then click **Handover & Issue**, then navigate to **Active Returns**.
* **What to Say**:
  > *"Next, we log in as the Lab In-charge: `incharge@college.edu`. On the dashboard, we see pending approvals and overdue checkouts.  
  > In the 'Requests Queue', the Lab In-charge sees the student's request with borrower details, purpose, and current shelf stock.  
  > Clicking 'Approve' transitions the request from 'Pending' to 'Approved'.  
  > Next, when the student physically comes to collect the item, the In-charge clicks 'Handover & Issue'. At this exact moment, the backend records the `issuedAt` timestamp, marks the status as 'Issued', and decrements the asset's available quantity by 1.  
  > Now let's visit 'Active Returns'. Here we see all currently checked-out equipment. When the student returns the item, the In-charge can record the return and grade the condition as 'OK', 'Damaged', or 'Lost'.  
  > If marked 'OK', the unit is restored to the available stock pool. If marked 'Damaged', the unit is flagged and not returned to the borrowable pool."*

---

### ⏱️ Segment 6: Overdue Detection & Live Dashboard Stats (7:00 – 8:00)
* **On Screen**: Show the red **OVERDUE** badge on items with past return dates, and show how the dashboard counters update.
* **What to Say**:
  > *"Our system automatically identifies overdue borrowings. If an equipment's status is 'Issued' and its expected return date is earlier than today's date, our Mongoose schema dynamically flags it as Overdue with visual badges and alerts.  
  > Notice that all numbers on the dashboard are dynamic aggregations computed in real-time from MongoDB queries rather than hardcoded figures."*

---

### ⏱️ Segment 7: Code Architecture Walkthrough (8:00 – 9:30)
* **On Screen**: Switch to your code editor / IDE. Briefly show `models/User.js`, `models/Asset.js`, `models/Request.js`, `middleware/auth.js`, `routes/labIncharge.js`, and `views/`.
* **What to Say**:
  > *"Briefly looking at the code architecture:  
  > 1. We used a clean MVC pattern. In `models/`, we defined `User`, `Asset`, and `Request` schemas with clear data types and Mongoose references.  
  > 2. In `middleware/auth.js`, we implemented simple, readable route guards like `isLoggedIn`, `isAdmin`, `isLabIncharge`, and `isRequester` to enforce security.  
  > 3. In `routes/labIncharge.js`, our issue route performs the critical business logic check: verifying `request.quantity <= asset.availableQuantity` before saving.  
  > 4. In `views/`, we used clean EJS partials for the header, footer, and navigation, styled with vanilla CSS without external bloat."*

---

### ⏱️ Segment 8: Conclusion (9:30 – 10:00)
* **On Screen**: Show the live running application or terminal test suite (`20/20 tests passed`).
* **What to Say**:
  > *"In conclusion, all core requirements of Problem Statement 8 — including asset CRUD, request workflows, over-issue prevention, return condition handling, overdue tracking, and live analytics — have been fully implemented, tested, and verified.  
  > Thank you very much for your time!"*
