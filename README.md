🍽️ Food Waste Management System – Website Donor – Receiver – Admin Food Sharing Platform

📖 Project Description

The Food Waste Management System Website is a web-based platform designed to reduce food wastage by connecting Donors, Receivers, and Admin through a centralized system.

This website allows donors to add food items, receivers to collect food, and admin to monitor all activities using a dashboard. The system stores all food records in a database and ensures secure collection using OTP verification.

The project is designed using proper:

ER Diagram DFD (Level 0, Level 1, Level 2) Database tables Role-based modules Inventory tracking

🎯 Objectives Reduce food wastage using website Track donated food items Provide inventory system Secure food collection using OTP Provide admin monitoring Maintain database records

👥 User Roles 👤 Donor Register / Login Add food item View My Inventory Verify receiver using OTP Manage donated food

📦 Receiver Register / Login View available food Accept food Enter OTP Collect food View collected food

🛠️ Admin Login dashboard View donors View receivers View food stock Monitor collection Manage system

🗄️ Database Design Donor donor_id (PK) name email mobile_number password address location

Receiver receiver_id (PK) name email mobile_number password address location

Food_Item food_id (PK) product_name quantity expiry_date image barcode location donor_id (FK)

Collection collection_id (PK) food_id (FK) receiver_id (FK) otp status collection_time

Admin admin_id (PK) email password

🔄 System Flow User registers / login Donor adds food Food stored in database Receiver views food Receiver accepts item OTP generated Donor verifies OTP Food collected Admin monitors dashboard

📊 DFD Overview Level 0

Donor → System → Receiver Admin monitors system

Level 1 Registration & Login Food Donation Inventory Receiver verification Admin dashboard

Level 2 Enter food details Generate barcode Store in database Accept request OTP verification Update collection

🏗️ Website Architecture User (Donor / Receiver / Admin) ↓ Website ↓ Backend ↓ Database

💻 Technologies Used Frontend

HTML CSS JavaScript Bootstrap

Backend Node.js / Express (optional)

Database MongoDB / MySQL

Other OTP verification Barcode support Login authentication 🔐 Security Features Login authentication OTP verification Role-based access Database validation Secure collection

✅ Features ✔ Food donation ✔ Food collection ✔ Inventory system ✔ OTP verification ✔ Admin dashboard ✔ Database tracking ✔ Multi-user login ✔ Structured system

🚀 Future Improvements QR code support Cloud deployment Notifications Location tracking Mobile app NGO integration

📌 License Educational Project – For learning purpose only
