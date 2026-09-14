# PPT Presentation Outline & Slide Deck Content
## PS 8: Lab Equipment & Asset Issue-Return Tracking System

Use this content directly in your PowerPoint / Google Slides presentation for Assignment-2.

---

### Slide 1: Title Slide
* **Title**: Lab Equipment & Asset Issue-Return Tracking System
* **Subtitle**: Institutional Asset Management — Problem Statement 8
* **Course**: Web Application Development / Full Stack Engineering (Assignment-2)
* **Student Name**: [Your Name]
* **Roll Number**: [Your Roll Number - Last digit 8]
* **College/Department**: Department of Computer Science & Engineering
* **Date**: September 2026

---

### Slide 2: Problem Statement
* **Background**: College laboratories house critical, expensive equipment (oscilloscopes, laptops, sensors, optical benches, microcontrollers).
* **Current Challenges**:
  * Reliance on paper logbooks leads to illegible records and lost assets.
  * Inability to verify real-time shelf stock before promising equipment.
  * Lack of automated tracking for overdue returns and inspections.
  * Inadequate recording of damaged or missing units.

---

### Slide 3: Project Objectives
* Design and implement a centralized, web-based issue-return system.
* Provide strict role-based access for Requesters, Lab In-charge, and Administrators.
* Guarantee real-time stock integrity: completely eliminate over-issuing through backend validation.
* Automate detection and flagging of overdue equipment.
* Establish transparent condition grading upon return (`OK`, `Damaged`, `Lost`).
* Deliver real-time institutional analytics on a live dashboard.

---

### Slide 4: Technology Stack
* **Frontend**: EJS (Embedded JavaScript) Server-Side Rendering
* **Backend**: Node.js + Express.js (MVC Architecture)
* **Database**: MongoDB Atlas (Cloud NoSQL Database via Mongoose ODM)
* **Authentication**: Session-based authentication (`express-session`, `connect-mongo`, `bcryptjs`)
* **Styling**: Vanilla CSS (Responsive, Modern UI with card layouts and status badges)
* **Version Control & Deployment**: GitHub + Render Cloud Platform

---

### Slide 5: User Roles & Permissions
* **Requester (Student / Faculty)**:
  * Browse real-time available equipment inventory.
  * Submit equipment borrow requests with intended purpose and return date.
  * Track request lifecycle (`Pending` &rarr; `Approved` &rarr; `Issued` &rarr; `Returned`).
* **Lab In-charge**:
  * Review pending requests queue with one-click Approve or Reject.
  * Physically verify and issue approved equipment (reduces shelf inventory).
  * Record returns, inspect physical condition, and update stock accordingly.
* **Administrator**:
  * Complete CRUD control over institutional assets (Add, View, Edit, Delete).
  * Monitor global laboratory metrics, overdue checkouts, and damaged items.

---

### Slide 6: Key Features & Business Logic
* **No Over-Issuing**: Strict server-side validation: `requestedQuantity <= availableQuantity`.
* **Dynamic Overdue Flagging**: Computed automatically when `status === 'Issued' && expectedReturnDate < currentDate`.
* **Smart Condition Grading on Return**:
  * `OK`: Increments available stock back to shelf.
  * `Damaged`: Marks item damaged; units are not re-issued to students.
  * `Lost`: Permanently decrements total owned inventory.
* **Maintenance Log (Stretch Feature)**: Tracks service dates, repair costs, and next service due dates per asset.

---

### Slide 7: Database Design (Mongoose Models)
* **Users Collection**:
  * Fields: `name`, `email`, `password` (salted & hashed), `role` (`requester`, `lab-incharge`, `admin`).
* **Assets Collection**:
  * Fields: `assetTag` (Unique), `name`, `category`, `location`, `condition`, `quantity`, `availableQuantity`, `maintenanceLogs`.
* **Requests Collection**:
  * Fields: `requester` (Ref &rarr; User), `asset` (Ref &rarr; Asset), `quantity`, `purpose`, `expectedReturnDate`, `status`, `issuedAt`, `returnedAt`, `returnCondition`, `remarks`.

---

### Slide 8: Equipment Lifecycle Workflow
```text
[ Requester ]
     │
     ▼ (1. Browses Available Stock & Submits Request)
[ Status: Pending ]
     │
     ▼ (2. Lab In-charge Reviews)
[ Status: Approved / Rejected ]
     │
     ▼ (3. Physical Handover: availableQuantity Decreases)
[ Status: Issued ]
     │
     ▼ (4. Return Recorded & Condition Inspected)
[ Status: Returned ]
     │
     ├── Condition OK ───────► availableQuantity Restored
     ├── Condition Damaged ──► Stock Flagged, Not Re-issued
     └── Condition Lost ─────► Total Quantity Decremented
```

---

### Slide 9: Application Screenshots & UI Showcase
*(Include screenshots of the following pages in your slides)*:
1. **Admin Dashboard**: Live statistic cards (Total, Available, Issued, Overdue, Damaged).
2. **Asset Management Table**: Inventory list with tag, condition badge, and edit/delete triggers.
3. **Requester Catalog & Request Form**: Clean equipment cards with available stock indicator and date picker.
4. **Lab In-charge Queue & Return Modal**: One-click approvals and return condition selector (`OK`, `Damaged`, `Lost`).

---

### Slide 10: Conclusion & Future Scope
* **Conclusion**:
  * Successfully built and deployed a fully functional, reliable lab equipment tracking system.
  * Completely satisfied all mandatory requirements of PS 8 without unnecessary framework bloat.
  * Fully prepared for production hosting and academic demonstration.
* **Future Scope**:
  * Automated email/SMS alerts to students 24 hours prior to overdue date.
  * QR / Barcode scanning for instant equipment checkouts via mobile cameras.
  * Departmental budget tracking for damaged equipment replacement.
