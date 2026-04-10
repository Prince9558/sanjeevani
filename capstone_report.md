# CAPSTONE PROJECT REPORT

**PROJECT TITLE**: Sanjeevani – A Smart Way to Reduce Food Wastage

**SUBMITTED FOR**: Capstone Project Evaluation

---

## DECLARATION
I/We hereby declare that the project titled **"Sanjeevani – A Smart Way to Reduce Food Wastage"** submitted for the Capstone Project is a record of original work done by me/us. This project work has not been submitted previously in part or full to this or any other university for the award of any degree or diploma.

**Date:** .........................
**Signature:** .........................

---

## CERTIFICATE
This is to certify that the Capstone Project report entitled **"Sanjeevani – A Smart Way to Reduce Food Wastage"** is a bonafide record of the project work carried out by the student(s) under my supervision and guidance. 

**Supervisor/Guide:** .........................
**Date:** .........................

---

## ACKNOWLEDGEMENT
We express our immense gratitude to our guide and the academic faculty for their constant support, guidance, and encouragement throughout the course of this project. We also thank our peers and all those who directly or indirectly helped us in successfully completing this capstone project.

---

## ABSTRACT

Food wastage is a critical global issue that coexists with severe starvation and hunger. A significant amount of untouched food from restaurants, events, and households ends up in landfills. **Sanjeevani** is a web-based, comprehensive platform developed to bridge the gap between food surplus (Donors) and food deficit (Receivers). 

Built using the robust **MERN Stack (MongoDB, Express.js, React.js, Node.js)**, Sanjeevani acts as a fast, secure, and user-friendly portal. It incorporates a unique **Food Traceability System**, utilizing dynamic QR generation to track the origin, preparation time, and expiry constraints of food packages. It seamlessly connects Donors (individuals, organizations, event managers) to Receivers (NGOs, orphanages, individuals in need).

Key features of this system include:
*   Secure User Authentication & Authorization.
*   Intuitive Dashboards for Donors, Receivers, and Admins.
*   Digital QR-Based Labeling for Food Authenticity and Traceability.
*   Cloudinary Integration for robust image storage.
*   Dynamic real-time food catalog updates and stock management.
*   A transparent feedback loop to ensure trust between Donors and Receivers.

This project outlines the problem of food wastage, our technological approach to solving it, system architecture, database design, and detailed implementation modules.

---

## TABLE OF CONTENTS

1.  **INTRODUCTION**
    1.1 Background & Motivation
    1.2 Problem Statement
    1.3 Objectives
    1.4 Scope of the Project
2.  **LITERATURE REVIEW**
    1.1 Existing Systems
    1.2 Proposed System Advantages
3.  **TECHNOLOGY STACK & SYSTEM REQUIREMENTS**
    3.1 Hardware Requirements
    3.2 Software Requirements
    3.3 Technologies Used
4.  **SYSTEM ANALYSIS & DESIGN**
    4.1 System Architecture
    4.2 Use Case Analysis
    4.3 Data Flow & Workflows
    4.4 Database Schema
5.  **IMPLEMENTATION & MODULES**
    5.1 User Authentication Module
    5.2 Donor Module & Traceability
    5.3 Receiver Module
    5.4 Admin Module
    5.5 Additional Integrations (QR Codes, Cloudinary, Emails)
6.  **TESTING & QUALITY ASSURANCE**
    6.1 Testing Methodologies
    6.2 Unit Testing
    6.3 Integration Testing
    6.4 User Acceptance Testing
7.  **RESULTS & UI DEMONSTRATION**
8.  **CONCLUSION & FUTURE SCOPE**
    8.1 Conclusion
    8.2 Limitations
    8.3 Future Enhancements
9.  **REFERENCES**

---

## 1. INTRODUCTION

### 1.1 Background & Motivation
Every year, roughly one-third of the food produced in the world for human consumption gets lost or wasted. In contrast, millions of people suffer from hunger and malnutrition. In developing countries, waste heavily occurs at the consumption level—be it restaurants, large-scale events, or households. The motivation behind *Sanjeevani* is to utilize modern web technologies to create a digital bridge, establishing an ecosystem where surplus food can be safely and reliably transported to those who need it most.

### 1.2 Problem Statement
Despite the willingness of several organizations and individuals to donate leftover, untouched food, there exists a massive communication and logistics gap. 
- *Lack of a dedicated platform* to connect donors with nearby NGOs.
- *Fear of food spoilage and health hazards*: Users are hesitant to consume donated food without knowing when it was cooked or when it expires.
- *Inefficient stock management*: Donors struggle to keep track of what has been claimed, and NGOs struggle to verify the quality of what is arriving.

### 1.3 Objectives
- To develop an interactive and scalable web application that allows users to register as Donors, Receivers, or Admins.
- To provide a real-time digital bulletin board displaying available food donations.
- To implement standard **Traceability** by storing cooked time, food type (Cooked/Uncooked), and expiry.
- To utilize **QR Codes** to bind digital data to physical food packages, enhancing transparency.
- To enforce a feedback loop ensuring only trustworthy participants remain in the network.

### 1.4 Scope of the Project
The current scope includes internet-based food sharing within localized zones. Donors log in, list their surplus food with images, configure the expiry timing, and auto-generate printable QR labels. Receivers (mostly verified NGOs) log in, see food availability, claim the food, and leave feedback. Admins oversee the ecosystem, resolving reports and managing overall stock statistics. The scope is restricted to software connectivity; physical logistics/delivery is currently assumed to be managed out-of-band by the claimant.

---

## 2. LITERATURE REVIEW

### 2.1 Existing Systems
Various NGOs use basic WhatsApp groups, Facebook pages, or phone-call-based trees to find leftover food from events. Some basic web applications exist, but they mostly function like pure forums.
*Drawbacks in current approaches:*
1.  **No Quality Checks:** It relies purely on trust. There is no proof of when the food was prepared.
2.  **No Image Proof:** Without visual validation, Receivers spend resources travelling only to find inadequate food quality.
3.  **Manual Tracking:** No real-time stock deductions—resulting in multiple Receivers aiming for the same donation.
4.  **Scaling Issues:** Simple messaging groups cannot scale beyond a few hundred members without becoming noisy and chaotic.

### 2.2 Proposed System Advantages
*Sanjeevani* combats the above flaws through:
1.  **Traceability Data Points:** By mandating "Cooked Time" and "Expiry Date", food safety is prioritized.
2.  **Digital QR Authentication:** Scanning a food package will reveal its exact digital manifest, removing ambiguity.
3.  **Cloud Storage via Cloudinary:** Donors upload images which are instantly compressed, stored globally, and rapidly served.
4.  **Concurrency Control:** Mongoose schemas track remaining food stock so once a batch is claimed, it disappears from the available pool.

---

## 3. TECHNOLOGY STACK & SYSTEM REQUIREMENTS

### 3.1 Hardware Requirements
- **Processor:** Intel Core i3 (or equivalent) and above.
- **RAM:** 4GB minimum (8GB recommended for development).
- **Storage:** Minimum 500 MB for local project compilation and dependencies.
- **Internet:** Required to interact with MongoDB Atlas, Cloudinary, and APIs.

### 3.2 Software Requirements
- **Operating System:** Windows/macOS/Linux.
- **Environment:** Node.js Environment (v16.x or strictly higher).
- **Package Manager:** npm or yarn.
- **Tools:** VS Code (IDE), Postman (API Testing), GitHub (Version Control).

### 3.3 Technologies Used
Sanjeevani is built entirely on the **MERN** stack, offering a unified JavaScript ecosystem across the frontend and backend.

**Frontend:**
- **React.js:** Component-based library for building user interfaces dynamically.
- **React Router DOM:** For seamless client-side routing and Single Page Application (SPA) feel.
- **Tailwind CSS / Vanilla CSS:** Used for highly customized, modern, responsive glassmorphic UI designs.
- **Axios:** For executing asynchronous HTTP requests to the backend.

**Backend:**
- **Node.js:** JavaScript runtime to execute background operations.
- **Express.js:** Web framework for Node.js to easily manage API routes, requests, and middleware.
- **Cloudinary / Multer:** Multer intercepts the multipart/form-data containing files, and Cloudinary securely hosts them and provides optimized URLs.
- **Bcryptjs & JWT:** For securely hashing passwords and generating session tokens to maintain authorized states.

**Database:**
- **MongoDB:** A NoSQL documentation database storing unstructured but highly scalable food and user datasets.
- **Mongoose:** An Object Data Modeling (ODM) library validating data structures before insertion.

---

## 4. SYSTEM ANALYSIS & DESIGN

### 4.1 System Architecture
The application follows a standard Three-Tier Architecture:
1.  **Presentation Layer (Frontend):** Developed in React. Handles visual rendering, captures user inputs, validates them locally, and pushes them to the server.
2.  **Application Layer (Backend Server):** Hosted on Node.js/Express. It houses the core business logic—verifying logins, generating QR data, talking to image buckets, and parsing requests.
3.  **Data Layer (Database):** Hosted on MongoDB Atlas. Organizes data into `Users`, `Foods`, `Feedbacks` collections.

### 4.2 Use Case Analysis

**Actor 1: Donor**
- Signs up/Logs into the portal.
- Creates a new food listing with details (Quantity, Cooked Time, Image).
- Generates and prints QR Labels.
- Views past donations.

**Actor 2: Receiver**
- Signs up/Logs in.
- Browses available donations in real-time.
- Claims food.
- Leaves feedback regarding food quality and donor behavior.

**Actor 3: Admin**
- Logs into secure Admin console.
- Resolves disputes.
- Manages platform statistics.

### 4.3 Data Flow & Workflows
When a donor uploads food:
1. Client selects image and enters text -> React bundles as `FormData`.
2. Axios posts data to Express route `/api/food/add`.
3. Express middleware (`multer-storage-cloudinary`) intercepts the image, pushes it to Cloudinary.
4. Cloudinary responds with a valid secure URL.
5. Node appends this URL to the text payload, interacts with Mongoose, and saves a Document to MongoDB.
6. The frontend receives a `200 OK` and re-fetches the list, rendering the new card.

### 4.4 Database Schema (Overview)
- **User Schema:** `name`, `email`, `password` (hashed), `role` (Donor/Receiver/Admin), `contact`, `createdAt`.
- **Food Schema:** `donorId` (ref: Users), `foodName`, `imagePath`, `quantity`, `type` (Cooked/Uncooked), `cookedTime`, `expiryTime`, `isClaimed`, `claimedBy` (ref: Users).
- **Feedback Schema:** `fromUser`, `toUser`, `comments`, `rating`.

---

## 5. IMPLEMENTATION & MODULES

### 5.1 User Authentication Module
Security is foundational. When a user registers, their raw password is encrypted using `bcrypt.js` with salt-rounds before saving to DB. Upon login, a `JSON Web Token (JWT)` is generated. This token is stored in the browser's local storage and attached via Headers as `Bearer <token>` to all subsequent requests. Protected Routes actively verify this token; expired tokens force re-authentication.

### 5.2 Donor Module & Food Traceability
This module represents the core innovation:
- **Traceability Data:** The form mandates capturing precisely when food was cooked. 
- **QR Code Binding:** The system relies on the `qrcode` NPM package. When food is added, the server generates a unique MongoDB `_id` for that batch. A QR code image mapping to `/api/food/details/:id` is created. Donors can print these labels and stick them on the physical boxes.
- Receivers scanning the box instantly view the web-page with real details, eliminating "blind" consumption.

### 5.3 Receiver Module
A dynamic dashboard displays available foods via beautiful, responsive CSS cards. The interface avoids reloading using React State management. Receivers utilize a "Claim" button that mathematically reduces the available stock on the backend using Mongoose `$set` operator, instantly hiding it from other Receivers to prevent conflict.

### 5.4 Admin Module
Admins possess elevated privileges verified via JWT roles. Their dashboards strip down unnecessary visual noise to focus on tabular records of active users, reported items, and overall system health. Admins can revoke access to anomalous users to ensure system hygiene.

### 5.5 Integrations
- **Email Systems:** NodeMailer / Resend is configured to trigger vital alerts (e.g., successful registration or feedback delivery routing to emails).
- **Image Cloud:** Using Multer & Cloudinary prevents Database bloat (MongoDB restricts document size to 16MB; base64 strings easily hit this limit. Cloudinary optimizes and caches images.)

---

## 6. TESTING & QUALITY ASSURANCE

### 6.1 Testing Methodologies
Rigorous testing was performed to maintain a high standard of code execution and user experience. 

### 6.2 Unit Testing
Individual API routes were tested heavily in **Postman**:
- Checking if `/register` rejects duplicate emails.
- Checking if missing mandatory fields throw proper `400 Bad Request` messages instead of crashing the Node server (`500 Internal Error`).
- Checking if token invalidation works.

### 6.3 Integration Testing
Ensured the combination of React frontend and Node backend was perfectly synced. Fixed multiple occurrences of **CORS (Cross-Origin Resource Sharing)** issues during environment transition by dynamically setting allowed Origin headers depending on DEV (localhost:3000) vs PROD.

### 6.4 Component & UI Testing
- **Responsiveness Check:** The platform was validated on Desktop, Tablet, and Mobile views. CSS Flexbox and Grids ensured elements resized properly.
- **Glassmorphic UI Check:** Verified that background images remained visible beneath UI elements while ensuring text contrast and legibility remained intact.

---

## 7. SYSTEM RESULTS & UI DEMONSTRATION

*(Note to student: Add Screenshots in this section of your Word Document)*

1.  **Figure 1.0: Home/Landing Page** - Showcasing the aesthetic glassmorphic login system.
2.  **Figure 2.0: Donor Dashboard** - Visualizing the Add Food menu with "Cooked Time" tracking.
3.  **Figure 3.0: QR Code Print Layout** - Displaying the generated QR Label.
4.  **Figure 4.0: Receiver Dashboard** - Displaying grid cards of food items retrieved securely from Cloudinary.
5.  **Figure 5.0: Mobile Responsive View** - Showing how the hamburger menu and cards stack effortlessly on smaller devices.

---

## 8. CONCLUSION & FUTURE SCOPE

### 8.1 Conclusion
The **Sanjeevani Food Wastage Reduction** Platform serves its ultimate purpose by digitally bridging those who have excess with those who have less. By enforcing strict tracking on "Cooked Time" and introducing digital labeling through intelligent QR codes, it replaces traditional chaos with a highly trusted logistics platform. Utilizing the modern MERN stack enabled rapid development, extreme scalability, and excellent performance, assuring that Sanjeevani can handle large-scale deployment.

### 8.2 Limitations
1.  **Logistics:** The platform strictly acts as a linker. Physical delivery relies on the Receiver traveling to the Donor, which occasionally falls through.
2.  **Hardware Dependency:** The platform assumes mobile connectivity. Users without internet connections cannot instantly benefit.

### 8.3 Future Enhancements
Looking ahead, the Capstone project can be upgraded significantly:
- **GPS / Map Integration:** Showcasing food donations strictly based on Google Maps proximities.
- **Push Notifications:** Integrating WebSockets (Socket.io) or Firebase to instantly notify NGOs of a massive localized donation.
- **Outsourced Logistics Integration:** Linking automated delivery partners (e.g., Dunzo, Uber Connect) such that upon a "Claim", a delivery driver is instantly routed.

---

## 9. REFERENCES

1. MongoDB Documentation. Retrieved from *https://docs.mongodb.com/*
2. Express JS Manual. Retrieved from *https://expressjs.com/*
3. React Official Documentation. Retrieved from *https://reactjs.org/docs/getting-started.html*
4. Node.js official site and NPM registry. *https://nodejs.org/*
5. Cloudinary Image Storage & Delivery API. *https://cloudinary.com/documentation*
6. Tutorials on JWT implementation. *https://jwt.io/introduction*

// END OF REPORT
