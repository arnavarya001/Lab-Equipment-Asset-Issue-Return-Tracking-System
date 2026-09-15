# PPT Presentation Outline & Slide Deck Content
## Institutional Asset Management — Equipment Issue & Return Tracking System

Use this complete slide-by-slide structure directly for your PowerPoint / Google Slides presentation. Every requirement, user role, workflow, and stretch goal is comprehensively covered.

---

### Slide 1: Title Slide
* **Title**: Institutional Asset Management System
* **Subtitle**: Equipment Issue & Return Tracking for Staff and Students
* **Domain**: Institutional Asset Management
* **Course**: Web Application Development / Full Stack Engineering
* **Presenter**: [Your Name]
* **Roll Number**: [Your Roll Number]
* **Department**: Department of Computer Science & Engineering
* **Date**: September 2026
* **Visual Tip**: Clean title layout with institutional logo and tech badges (Node.js, Express, MongoDB, EJS).

---

### Slide 2: Project Domain & Problem Context
* **Domain**: Institutional Asset Management
* **Core Purpose**: Track institutional assets and laboratory equipment as they are issued to and returned by staff or students.
* **The Problem with Traditional Lab Management**:
  * **Manual Paper Registers**: Equipment checkouts written in physical books lead to misplaced inventory and unreadable entries.
  * **Stock Discrepancies & Over-issuing**: In-charges cannot instantly know available shelf stock, leading to over-committing items.
  * **Untracked Overdue Items**: Borrowers keep equipment past deadlines with no automated overdue alerting.
  * **Unrecorded Damage/Loss**: Equipment returned in broken or incomplete condition without formal inspection grading.
* **The Solution**: A centralized, secure, role-based web application providing real-time stock guarantees, complete audit trails, and live analytics.

---

### Slide 3: Targeted Users & Role-Based Access Control
* **Three Distinct User Personas**:
  1. **Requester (Student / Staff)**:
     * Self-registers and logs in.
     * Browses real-time catalog of available laboratory instruments.
     * Raises issue requests specifying **intended purpose** and **expected return date**.
     * Tracks live request status (`Pending` &rarr; `Approved` &rarr; `Issued` &rarr; `Returned`).
  2. **Lab In-charge**:
     * Monitors incoming borrow requests in real-time.
     * **Approves or Rejects** requests with one click.
     * Records **physical issue/handover** (automatically decrements available shelf units).
     * Records **equipment returns** and grades physical condition (`OK`, `Damaged`, `Lost`).
  3. **Administrator**:
     * Complete institutional asset inventory control (Full CRUD).
     * Oversees laboratory-wide metrics on an interactive, live dashboard.
     * Manages asset maintenance and repair records (Stretch Goal).

---

### Slide 4: Core Features Overview (Requirement Checklist)
* ✅ **Role-Based Authentication**: Secure Registration & Login with session cookies and bcrypt password encryption.
* ✅ **Admin Asset CRUD**: Create, read, update, and delete institutional assets with all required attributes (`asset tag`, `name`, `category`, `lab/location`, `condition`, `quantity`).
* ✅ **Requester Self-Service**: Browse available equipment catalog, raise issue requests with `purpose` and `expected return date`.
* ✅ **Lab In-charge Request & Return Lifecycle**: Approve/reject requests, record physical handover/issue, record returns with condition inspection (`OK`, `Damaged`, `Lost`).
* ✅ **Critical Business Logic**:
  * **Zero Over-issuing**: Strict backend guard prevents issuing more units than physically available.
  * **Automated Overdue Detection**: Dynamically flags items past their return date.
* ✅ **Live Executive Dashboard**: Real-time aggregation of **Total Assets**, **Available Units**, **Currently Issued**, **Overdue Returns**, and **Damaged/Lost Items**.
* 🌟 **Stretch Goal (Implemented)**: Maintenance logs per asset tracking **service date**, **repair cost**, and **next service due date**.

---

### Slide 5: Admin Asset CRUD & Inventory Management
* **Complete Asset Schema Attributes**:
  * **Asset Tag**: Unique alphanumeric institutional identifier (e.g., `OSC-001`, `LAP-102`).
  * **Equipment Name**: Clear descriptive title (e.g., *Digital Storage Oscilloscope 100MHz*).
  * **Category**: Classification (e.g., *Electronics, Computing, Optics, Mechanical*).
  * **Lab / Location**: Physical lab location (e.g., *Embedded Systems Lab - Room 304*).
  * **Condition**: Physical state (`OK`, `Damaged`, `Lost`).
  * **Quantity**: Total institutional units owned vs. Available shelf units.
* **Admin Actions**:
  * Add new equipment to institutional catalog.
  * Live searchable and filterable inventory table.
  * In-place editing of asset metadata and stock levels.
  * Safe deletion safeguards for inventory items.

---

### Slide 6: Requester Flow — Browse & Raise Issue Requests
* **Step 1: Real-time Catalog Browsing**:
  * Requesters view only items with available stock on lab shelves.
  * Clear visual badges indicate category, lab room, and remaining quantity.
* **Step 2: Raising an Issue Request**:
  * **Borrow Quantity**: Capped automatically to available stock (`max = availableQuantity`).
  * **Intended Purpose**: Mandatory justification (coursework, research project, workshop).
  * **Expected Return Date**: Mandatory future calendar date.
* **Step 3: Self-Service Request Tracking**:
  * Dedicated "My Requests" portal showing timeline status badges:
    * 🟡 `Pending` &rarr; 🔵 `Approved` &rarr; 🟣 `Issued` &rarr; 🟢 `Returned` (or 🔴 `Rejected`).

---

### Slide 7: Lab In-charge Operations — Approval, Issue & Return Grading
* **Request Queue Management**:
  * Live list of incoming borrow requests.
  * In-charge reviews applicant name, purpose, requested count, and proposed return date.
  * Quick action: **Approve** or **Reject** with optional remarks.
* **Physical Handover & Issue**:
  * Upon student arrival, In-charge clicks **"Handover & Issue"**.
  * Backend records `issuedAt` timestamp and decrements `asset.availableQuantity`.
* **Return Processing & Condition Grading**:
  * When equipment is physically returned, In-charge grades condition:
    * **`OK`**: Unit is functional; increments `availableQuantity` back to shelf inventory.
    * **`Damaged`**: Unit is marked damaged; quarantined from available pool and flagged for repair.
    * **`Lost`**: Total institutional inventory count is decremented; financial audit trail recorded.

---

### Slide 8: Business Logic & Stock Integrity
* **1. Guaranteed Prevention of Over-issuing**:
  * Frontend input limits: `max="<%= asset.availableQuantity %>"`.
  * **Backend Double-Check**: Before approving or issuing, the system verifies:
    $$\text{requestedQuantity} \le \text{asset.availableQuantity}$$
  * If stock is depleted between request and issue, the transaction is safely rejected with flash error.
* **2. Automated Dynamic Overdue Detection**:
  * Calculated automatically in real time:
    $$\text{isOverdue} = (\text{status} == \text{'Issued'}) \land (\text{expectedReturnDate} < \text{currentDate})$$
  * Prominent red **"OVERDUE"** warning badges on Admin and In-charge tables.
  * Real-time count reflected on the dashboard counters without manual refresh.

---

### Slide 9: Real-Time Institutional Dashboard
* **Dynamic MongoDB Aggregation Metrics**:
  1. **Total Asset Models**: Total distinct equipment catalog items registered.
  2. **Total Units Owned**: Cumulative institutional hardware inventory.
  3. **Available Units**: Units currently sitting on shelves ready to be borrowed.
  4. **Currently Issued**: Units actively checked out to students and staff.
  5. **Overdue Returns**: Active borrowings that have passed their expected return deadline.
  6. **Damaged / Lost Items**: Equipment flagged as out of service or lost during return inspections.
* **Recent Activity Log**: Shows recent checkout and return events with timestamps and user names.

---

### Slide 10: Stretch Goal — Asset Maintenance & Service Logs
* **Why It Matters**: High-value laboratory equipment requires periodic calibration, hardware servicing, and preventative maintenance.
* **Implemented Maintenance Features**:
  * Embedded directly into the Asset document model (`maintenanceLogs` array).
  * **Service Date**: Exact date of inspection or repair.
  * **Repair / Calibration Cost**: Direct financial tracking in local currency.
  * **Next Service Due Date**: Enables preventative maintenance reminders.
  * **Maintenance Notes / Technician Remarks**: Details of components repaired or replaced.
* **Admin Interface**: Admins can view complete historical service records for any asset and log new maintenance events with a single form.

---

### Slide 11: System Architecture & Database Design
* **Architecture**: Model-View-Controller (MVC) with Express.js and EJS.
* **Database Collections (MongoDB)**:
  * **`Users`**: `name`, `email`, `password` (bcrypt), `role` (`requester`, `lab-incharge`, `admin`), `requesterType` (`student`, `staff`).
  * **`Assets`**: `assetTag`, `name`, `category`, `location`, `condition`, `quantity`, `availableQuantity`, `maintenanceLogs`.
  * **`Requests`**: `requester` (Ref), `asset` (Ref), `quantity`, `purpose`, `expectedReturnDate`, `status`, `issuedAt`, `returnedAt`, `returnCondition`.
* **Security & Route Protection**:
  * Session cookies stored in MongoDB via `connect-mongo`.
  * Dedicated middleware guards: `isLoggedIn`, `isAdmin`, `isLabIncharge`, `isRequester`.

---

### Slide 12: Testing, Verification & Demonstration
* **End-to-End Automated Test Suite (`test_system.js`)**:
  * **20 / 20 Automated Tests Passing**:
    * Route guard unauthorized access tests.
    * Admin login & asset CRUD flow.
    * Requester over-issue block verification.
    * Lab In-charge approval, issue, decrement, and condition return restoration.
* **Live System Ready**:
  * Fast local development on Node.js / Express / MongoDB.
  * Zero external bloated frameworks; responsive, accessible vanilla CSS styling.

---

### Slide 13: Summary & Future Scope
* **Key Achievements**:
  * Built an end-to-end Institutional Asset Management system meeting 100% of functional requirements.
  * Robust data integrity: complete prevention of over-issuing and automated overdue flagging.
  * Fully implemented the **Maintenance Log** stretch goal.
* **Future Enhancements**:
  * Email / SMS automated reminder notifications 24 hours prior to return deadline.
  * QR Code / Barcode generation and scanning for instantaneous physical handovers.
  * Exportable PDF / Excel institutional inventory audit reports.
