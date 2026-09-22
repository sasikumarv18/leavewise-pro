# LeaveWise Pro

Advanced Prompt: College Leave Management System

Create a complete, modern, secure and responsive College Leave Management System web application for both Hostellers and Day Scholars.

The system must have three roles:

Admin

Sub-Admin

Student

The application should have a professional college-management-system design, responsive UI for desktop, tablet and mobile, secure authentication, role-based authorization, database integration, notifications, leave tracking and proper data privacy.

1. Project Objective

Build a centralized web-based leave management system where students can register, maintain their profile, apply for leave and receive leave-status notifications.

The Admin controls the entire system and can create/manage Sub-Admin accounts.

The Sub-Admin is the ONLY authorized person who can approve or reject student leave applications.

Students must NOT be able to:

View other students' profiles

View other students' leave applications

Approve or reject leave

Access Admin pages

Access Sub-Admin pages

Modify another student's information

Access administrative APIs directly

Change their own role or permissions

All sensitive information must be protected using proper authentication and server-side authorization.

2. User Roles and Permissions

ADMIN

Admin has the highest level of authority.

Admin dashboard should allow:

Secure Admin login

View dashboard statistics

Add Sub-Admin

Edit Sub-Admin

Delete/Deactivate Sub-Admin

View registered students

Search students

Filter students

View student profiles

View all leave applications

View leave history

View approved/rejected/pending leaves

View hosteller/day-scholar statistics

View department-wise information

View class-wise information

View total leave statistics

Manage student accounts

Activate/deactivate student accounts

View notifications

Manage system settings

IMPORTANT:

Admin can VIEW leave applications, but the normal leave approval authority must belong exclusively to the Sub-Admin.

Do not provide an Admin "Approve" or "Reject" button unless explicitly enabled through a separate emergency/system-management feature.

3. SUB-ADMIN

Sub-Admin accounts can ONLY be created directly by Admin.

There must NOT be a public Sub-Admin registration page.

Sub-Admin login should be separate or role-based.

Sub-Admin dashboard should allow:

View assigned student leave requests

View student information required for leave processing

View whether student is Hosteller or Day Scholar

View department

View class

View register number

View leave type

View leave dates

View number of leave days

View reason

View previous leave statistics

Approve leave

Reject leave

Add optional approval/rejection remarks

View pending leaves

View approved leaves

View rejected leaves

Search leave applications

Filter applications

Receive notifications for new leave applications

The Sub-Admin must be the ONLY role capable of approving or rejecting a leave application.

Enforce this restriction on the backend/server/API level, not only by hiding buttons in the frontend.

4. STUDENT REGISTRATION

Create a public Student Registration page.

Student registration form should contain:

Personal Information

Full Name

Email Address

Register Number

Password

Confirm Password

Academic Information

Department

Class

Student Type

Student Type must have:

Hosteller

Day Scholar

Department

Provide a dropdown for departments.

At minimum include:

Information Technology

Computer Science and Engineering

Electronics and Communication Engineering

Electrical and Electronics Engineering

Mechanical Engineering

Civil Engineering

Make departments configurable so Admin can add more departments later.

Class

Class must depend on the selected department.

For example:

Information Technology:

IT-A

IT-B

The architecture should support additional classes such as:

CSE-A

CSE-B

ECE-A

ECE-B

Do not hard-code the class system in a way that prevents future expansion.

5. STUDENT PROFILE

After registration and login, the student should have a profile page.

Display:

Name

Email

Register Number

Student Type

Department

Class

Account status

Provide an Edit Profile option.

Students can correct permitted profile information if they entered something incorrectly.

However:

Register Number should have restricted editing or require Admin approval.

Students must not be able to change their role.

Students must not be able to change another student's information.

Students must not be able to modify administrative fields.

Use proper validation for all profile updates.

6. STUDENT LOGIN

Create secure Student Login.

Student login should use:

Email/Register Number

Password

Implement:

Password hashing

Session/token authentication

Secure logout

Invalid login handling

Account status checking

Role verification

Protected routes

Never store passwords in plain text.

7. LEAVE APPLICATION

Create a dedicated Apply Leave page.

The form must contain:

Leave Type

Dropdown:

Medical Leave

Personal Leave

Emergency Leave

Other

Leave Information

Leave Start Date

Leave End Date

Number of Days

Reason for Leave

Optional supporting document upload

Automatically calculate the number of leave days from the selected dates.

Example:

Start Date: 15-08-2026
End Date: 17-08-2026

Automatically calculate:

3 Days

Do not allow invalid date ranges.

8. LEAVE APPLICATION VALIDATION

Before submitting a leave request:

Start date cannot be after end date.

Number of days must match the date range.

Leave type is mandatory.

Reason is mandatory.

Student must be authenticated.

Student account must be active.

Prevent unauthorized modification of another student's leave.

Validate uploaded files securely.

Restrict dangerous file types.

Apply reasonable file-size limits.

After successful submission:

Display:

"Leave application submitted successfully."

Generate a unique Leave Application ID.

Example:

LV-2026-000123

9. IMPORTANT STUDENT LEAVE STATISTICS

Whenever a student applies for a new leave, the Sub-Admin should be able to see the student's previous leave information.

For example:

Student: Rahul Kumar
Register No: 23IT101
Student Type: Hosteller
Department: Information Technology
Class: IT-A

Leave Statistics:

Total Leave Applications: 8

Approved Leaves: 5

Rejected Leaves: 2

Pending Leaves: 1

Total Approved Leave Days: 14

Total Rejected Leave Days: 4

Total Pending Leave Days: 2

Show this information directly while the Sub-Admin reviews a new leave request.

10. LEAVE REQUEST DETAILS FOR SUB-ADMIN

When a new leave request arrives, the Sub-Admin should see a complete request card/page.

Display:

Student Information

Student Name

Register Number

Student Type

Department

Class

Email

Current Leave Request

Leave Application ID

Leave Type

Start Date

End Date

Number of Days

Reason

Uploaded supporting document

Application date

Current status

Previous Leave Summary

Total applications

Approved applications

Rejected applications

Pending applications

Total approved leave days

Previous leave history

Provide buttons:

Approve

Reject

If rejecting, require a rejection reason or remark.

If approving, optionally allow an approval remark.

11. LEAVE STATUS

Every leave application must have one of these statuses:

Pending

Approved

Rejected

Cancelled

Default status after application:

Pending

Only the Sub-Admin can change:

Pending → Approved

or

Pending → Rejected

Students can view the status of ONLY their own applications.

12. NOTIFICATION SYSTEM

Implement an internal notification system.

When Student Applies Leave

Immediately create a notification for the appropriate Sub-Admin.

Example:

New Leave Application

"New leave application submitted by Rahul Kumar (23IT101)."

Notification should contain a link to the leave request.

When Sub-Admin Approves Leave

Send a notification to ONLY the student who submitted that leave.

Example:

Leave Approved

"Your leave application LV-2026-000123 has been approved."

Display:

Leave type

Dates

Number of days

Approval date

Sub-Admin remark

When Sub-Admin Rejects Leave

Send notification ONLY to the relevant student.

Example:

Leave Rejected

"Your leave application LV-2026-000123 has been rejected."

Display:

Leave type

Dates

Number of days

Rejection date

Rejection reason

Students must never receive notifications belonging to other students.

13. NOTIFICATION UI

Create a notification bell in the dashboard header.

Display:

Unread notification count

Notification list

Read/unread state

Notification timestamp

Link to relevant application

Provide:

Mark as Read

and optionally:

Mark All as Read

14. STUDENT DASHBOARD

Create a clean student dashboard.

Display cards:

Total Leave Applications

Pending Leaves

Approved Leaves

Rejected Leaves

Total Approved Leave Days

Add buttons:

Apply Leave

My Leave History

My Profile

Notifications

Logout

Student leave table:

Application ID Leave Type From To Days Status

IMPORTANT:

Students must only see their own records.

15. SUB-ADMIN DASHBOARD

Create a professional Sub-Admin dashboard.

Dashboard cards:

Pending Applications

Approved Applications

Rejected Applications

Total Applications

Hosteller Requests

Day Scholar Requests

Add charts:

Leave applications by month

Approved vs rejected leaves

Leave type distribution

Hosteller vs Day Scholar requests

Department-wise leave applications

Add a Pending Requests section.

Each request should clearly display:

Student name

Register number

Hosteller/Day Scholar

Department

Class

Leave type

Dates

Number of days

Reason

Previous leave statistics

Approve button

Reject button

16. ADMIN DASHBOARD

Create a professional Admin dashboard.

Dashboard statistics:

Total Students

Total Hostellers

Total Day Scholars

Total Sub-Admins

Total Leave Applications

Pending Applications

Approved Applications

Rejected Applications

Add charts for:

Department-wise students

Hosteller vs Day Scholar

Monthly leave applications

Leave types

Approval/rejection statistics

17. STUDENT MANAGEMENT

Admin should have a Student Management page.

Features:

View all students

Search by name

Search by register number

Filter by department

Filter by class

Filter by Hosteller/Day Scholar

Filter by active/inactive status

View student profile

Edit student profile

Activate account

Deactivate account

Use pagination for large numbers of students.

18. SUB-ADMIN MANAGEMENT

Admin should have a Sub-Admin Management page.

Features:

Add Sub-Admin

View Sub-Admins

Edit Sub-Admin

Activate/deactivate Sub-Admin

Delete/deactivate account

Reset password through secure process

Public users must never be able to register as Sub-Admin.

19. SECURITY REQUIREMENTS

Security is extremely important.

Implement:

Authentication

Secure password hashing using Argon2 or bcrypt

Secure sessions/JWT

Logout functionality

Session expiration

Password reset mechanism

Strong password validation

Authorization

Use Role-Based Access Control:

ADMIN
SUB_ADMIN
STUDENT


Every protected backend endpoint must verify:

Authentication

User identity

User role

Resource ownership/permission

Never depend only on frontend route protection.

20. DATA PRIVACY

Students must NEVER be able to access:

Other students' profiles

Other students' email addresses

Other students' register numbers

Other students' leave history

Other students' notifications

Admin information

Sub-Admin information

Administrative APIs

For example, if Student A attempts to access:

/student/profile/student-B-id

the server must return:

403 Forbidden

or an appropriate unauthorized response.

Do not simply hide the page using frontend code.

21. DATABASE DESIGN

Create a normalized relational database.

Recommended tables:

users

id

name

email

password_hash

role

status

created_at

updated_at

students

id

user_id

register_number

student_type

department_id

class_id

created_at

updated_at

sub_admins

id

user_id

department/class assignment if required

created_at

updated_at

departments

id

department_name

classes

id

department_id

class_name

leave_applications

id

application_number

student_id

leave_type

start_date

end_date

number_of_days

reason

attachment_url

status

submitted_at

reviewed_at

reviewed_by

review_remark

notifications

id

recipient_user_id

title

message

leave_application_id

is_read

created_at

Add proper primary keys, foreign keys, indexes and constraints.

22. DATA OWNERSHIP

Implement strict ownership rules.

Student:

Can CREATE their own leave
Can READ their own leave
Can UPDATE their own permitted profile
Cannot READ another student's leave
Cannot UPDATE another student's leave
Cannot DELETE another student's leave


Sub-Admin:

Can READ assigned/pending student requests
Can APPROVE/REJECT leave
Can VIEW relevant student leave history
Cannot change Admin permissions
Cannot create another Sub-Admin


Admin:

Can manage users
Can manage Sub-Admins
Can view students
Can view leave applications
Can manage system configuration


23. AUDIT LOG

Create an audit log system.

Record important actions:

Student registration

Profile modification

Leave submission

Leave approval

Leave rejection

Sub-Admin creation

Account activation/deactivation

Administrative changes

Audit log should record:

User

Action

Timestamp

Related record

IP address where appropriate

Only authorized administrators should be able to view audit logs.

24. USER INTERFACE

Design should look like a professional modern college management portal.

Use:

Clean dashboard

Sidebar navigation

Top navigation bar

Notification bell

Profile menu

Cards

Tables

Search

Filters

Modal dialogs

Confirmation dialogs

Toast notifications

Loading indicators

Empty states

Error states

Responsive design

Create separate visual dashboards for:

Admin

Sub-Admin

Student

Use a consistent professional color scheme and accessible typography.

25. RESPONSIVE DESIGN

The application must work properly on:

Desktop

Laptop

Tablet

Android phones

iPhones

Tables should become horizontally scrollable or responsive cards on small screens.

Forms should be mobile-friendly.

26. ERROR HANDLING

Implement proper error messages.

Examples:

Invalid login:

"Invalid email/register number or password."

Unauthorized access:

"You do not have permission to access this page."

Duplicate registration number:

"This register number is already registered."

Invalid leave:

"Leave end date cannot be earlier than start date."

Successful application:

"Leave application submitted successfully."

27. SEARCH AND FILTER

Admin and Sub-Admin should have powerful filtering.

Filters:

Student name

Register number

Department

Class

Hosteller/Day Scholar

Leave type

Leave status

Date range

Add sorting by:

Newest

Oldest

Leave date

Student name

28. DOCUMENT UPLOAD

Allow students to optionally upload supporting documents for appropriate leave types, especially medical leave.

Security requirements:

Validate file extension

Validate MIME type

Limit file size

Rename uploaded files safely

Store files securely

Do not expose private file paths publicly

Only authorized users can access the document

29. API DESIGN

Create secure REST APIs or an equivalent backend architecture.

Example endpoints:

POST   /api/auth/student/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/student/profile
PUT    /api/student/profile

POST   /api/student/leaves
GET    /api/student/leaves
GET    /api/student/leaves/:id

GET    /api/subadmin/leaves
GET    /api/subadmin/leaves/:id
PATCH  /api/subadmin/leaves/:id/approve
PATCH  /api/subadmin/leaves/:id/reject

GET    /api/admin/students
GET    /api/admin/students/:id
POST   /api/admin/subadmins
PUT    /api/admin/subadmins/:id
PATCH  /api/admin/subadmins/:id/status

GET    /api/notifications
PATCH  /api/notifications/:id/read


Protect every endpoint with appropriate authorization middleware.

30. ROLE-BASED ROUTING

Implement protected routes.

Example:

/admin/*
/subadmin/*
/student/*


A student attempting to open:

/admin/dashboard


must receive an unauthorized response.

A student attempting to call an Admin API directly must also be denied.

A Sub-Admin attempting to access Admin-only functionality must be denied.

31. NOTIFICATION ARCHITECTURE

Use a reliable notification mechanism.

Prefer:

In-app notifications

Real-time updates using WebSockets where appropriate

Optional email notification support

Notification flow:

Student submits leave
        ↓
Leave status = Pending
        ↓
Sub-Admin notification created
        ↓
Sub-Admin reviews request
        ↓
Approve / Reject
        ↓
Database status updated
        ↓
Student notification created
        ↓
Student sees updated status


32. LEAVE HISTORY

Create a complete leave-history page for each student.

Display:

Application ID
Leave Type
Start Date
End Date
Days
Reason
Status
Submitted Date
Reviewed Date
Review Remark


Students see only their own history.

Sub-Admins see history for students they are authorized to review.

Admin can view overall leave history.

33. PROJECT DEMO FEATURES

Because this is a college project, include realistic demo data and a polished presentation.

Create sample:

Admin account

Sub-Admin account

Students

Departments

Classes

Leave applications

Do NOT hard-code real passwords.

Provide a secure development/demo seed mechanism.

34. TECHNOLOGY STACK

Use a modern full-stack architecture.

Preferred stack:

Frontend

React

TypeScript

Tailwind CSS

Responsive components

Backend

Node.js

Express.js

TypeScript

Database

PostgreSQL

Alternative:

MySQL

Authentication

Secure cookie-based sessions or JWT with secure implementation

bcrypt/Argon2 password hashing

Optional

WebSocket/Socket.IO for real-time notifications

Cloud/object storage for documents

Keep the architecture modular so technologies can be replaced later.

35. PROJECT STRUCTURE

Use a clean scalable structure such as:

client/
  components/
  pages/
  layouts/
  hooks/
  services/
  utils/

server/
  controllers/
  routes/
  middleware/
  services/
  models/
  validators/
  utils/

database/
  migrations/
  seed/

uploads/


Keep business logic out of UI components.

Use reusable components.

36. VALIDATION

Use both:

Frontend validation

for good user experience.

Backend validation

for security.

Never trust frontend validation alone.

Validate:

Email

Password

Register number

Department

Class

Student type

Leave type

Dates

Reason

Uploaded documents

37. IMPORTANT APPROVAL SECURITY RULE

This is one of the most important requirements.

The leave approval operation must be protected by backend authorization.

Only:

role === "SUB_ADMIN"


can approve or reject a pending leave.

The frontend button is NOT the security mechanism.

Even if a student manually sends an API request such as:

PATCH /api/subadmin/leaves/123/approve


the backend must reject it.

Return:

403 Forbidden


for unauthorized users.

38. FINAL USER FLOW

Implement the following complete workflow:

Student
   ↓
Open Registration Link
   ↓
Register Account
   ↓
Login
   ↓
Complete/View Profile
   ↓
Apply Leave
   ↓
Select Leave Type
   ↓
Select Start & End Dates
   ↓
Enter Reason
   ↓
Upload Supporting Document if required
   ↓
Submit
   ↓
Status = PENDING
   ↓
Sub-Admin receives notification
   ↓
Sub-Admin opens request
   ↓
Views student information
   ↓
Views Hosteller/Day Scholar status
   ↓
Views previous leave statistics
   ↓
Reviews reason/document
   ↓
APPROVE or REJECT
   ↓
Database updated
   ↓
Student receives notification
   ↓
Student views updated leave status


39. IMPORTANT PRIVACY RULE

Never expose the complete student database to students.

The student dashboard API should return only the authenticated student's information.

Use queries equivalent to:

WHERE student_id = authenticated_user.student_id


for student-owned resources.

Never trust a student-provided student ID to determine whose information they can access.

40. FINAL REQUIREMENTS

Before considering the project complete, verify all of the following:

Secure authentication works.

Student registration works.

Admin login works.

Sub-Admin can only be created by Admin.

Student profile editing works.

Hosteller/Day Scholar selection works.

Department and class selection works.

Leave application works.

Automatic leave-day calculation works.

Leave types work.

Supporting document upload works securely.

Sub-Admin receives new-leave notifications.

Sub-Admin can approve/reject.

No student can approve/reject.

No unauthorized user can access approval APIs.

Student receives approval/rejection notification.

Student can see only their own information.

Sub-Admin can see required student information.

Previous leave statistics appear during review.

Admin can view system-level information.

Audit logging works.

Search/filter works.

Responsive design works.

Error handling works.

Database relationships and constraints work.

Backend authorization is enforced.

No passwords are stored in plain text.

No sensitive student information is exposed through frontend or API responses.

Generate the complete working application with frontend, backend, database schema, authentication, authorization, API routes, validation, notification system, responsive UI and sample seed data.

Do not create a simple static prototype. Build it as a real full-stack college project architecture with security and role-based access control.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a7468c18-e756-47f5-a303-e5a5e9eb6c45).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
