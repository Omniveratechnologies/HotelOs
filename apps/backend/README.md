HotelOS Backend

Backend API for HotelOS, a multi-role hotel management system.

This backend is designed to support multiple frontend applications such
as:

Super Admin Dashboard

Hotel/Sub Admin Dashboard

Reception Dashboard

Kitchen Dashboard

Guest Dashboard

The backend provides authentication, role-based authorization, hotel
isolation, user management, credential generation, DTO-based API
responses, and the foundation for hotel operations such as rooms,
guests, orders, food items, and service requests.

1. Purpose of This README

This document is the main handoff guide for frontend developers working
on HotelOS.

If you are building the:

Reception frontend

Kitchen frontend

Guest frontend

Sub Admin frontend

Super Admin frontend

you should be able to use this README to understand:

How the backend is structured.

How authentication works.

How to obtain and send JWT access tokens.

Which roles exist.

What each role is allowed to do.

How users are created.

How hotel isolation works.

How API responses are structured.

How DTOs protect the frontend from raw database documents.

How to add future API modules.

How to test APIs using Requestly/Postman/curl.

What frontend developers should and should not send to the backend.

2. Project Overview

HotelOS follows a role-based architecture.

                    SUPER ADMIN
                         |
                         | creates/manages hotels
                         v
                    SUB ADMIN
                         |
             +-----------+-----------+
             |                       |
             v                       v
        RECEPTION                 KITCHEN
             |
             | creates guest account
             | during guest check-in
             v
           GUEST

The important rule is:

A frontend must never be trusted to decide which hotel a user belongs
to.

The backend determines hotel ownership from the authenticated user's
JWT.

For example, a Sub Admin belonging to Hotel A sends:

POST /api/v1/users

with:

{
"name": "Kitchen Operator",
"role": "KITCHEN"
}

The frontend does not send:

{
"hotelId": "HOTEL_B"
}

The backend obtains:

hotelId = req.user.hotelId

from the authenticated JWT.

This prevents a Sub Admin from creating users inside another hotel.

3. Technology Stack

The current backend uses:

Node.js

Express.js

MongoDB

Mongoose

JWT authentication

bcrypt/password hashing through the User model

CORS

Nodemon for development

The project uses ES Modules (import / export).

4. API Versioning

All APIs use version v1.

Base URL:

http://localhost:5001/api/v1

Examples:

POST /api/v1/auth/login
POST /api/v1/auth/logout

GET /api/v1/users
POST /api/v1/users

GET /api/v1/hotels
POST /api/v1/hotels

Future versions can use:

/api/v2/

without breaking existing v1 clients.

Important for frontend developers

Always build API calls using the /api/v1/ prefix.

Do not create frontend calls such as:

/api/users

when the backend endpoint is:

/api/v1/users

5. Local Development

Requirements

Install:

Node.js

npm

MongoDB or a MongoDB connection string

Requestly, Postman, curl, or another API client

Install dependencies

From the backend directory:

npm install

Environment variables

The backend uses environment configuration including the MongoDB
connection and JWT configuration.

A typical .env contains values similar to:

PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=your_expiration

Use the actual variable names already defined in the project's .env /
environment configuration.

Do not commit the real .env file to Git.

Use .env.example for documentation of required variables.

Start development server

npm run dev

Expected server:

http://localhost:5001

Health check:

GET http://localhost:5001/api/v1/health

Expected response:

{
"success": true,
"message": "HotelOS backend is running"
}

6. Backend Structure

The current project follows a controller/route/middleware/model
structure.

backend/
├── src/
│ ├── config/
│ │ ├── db.js
│ │ └── env.js
│ │
│ ├── constants/
│ │ └── roles.js
│ │
│ ├── controllers/
│ │ ├── auth.controller.js
│ │ ├── hotel.controller.js
│ │ └── user.controller.js
│ │
│ ├── dto/
│ │ └── user.dto.js
│ │
│ ├── middleware/
│ │ ├── auth.middleware.js
│ │ └── role.middleware.js
│ │
│ ├── models/
│ │ ├── Hotel.js
│ │ └── User.js
│ │
│ ├── routes/
│ │ ├── auth.routes.js
│ │ ├── hotel.routes.js
│ │ ├── hotelRoutes.js
│ │ └── user.routes.js
│ │
│ ├── seed/
│ │ └── superAdmin.seed.js
│ │
│ ├── services/
│ │
│ ├── utils/
│ │ ├── generateCredentials.js
│ │ ├── jwt.js
│ │ └── password.js
│ │
│ ├── validators/
│ │
│ ├── app.js
│ └── server.js
│
├── .env
├── .env.example
├── package.json
└── README.md

The exact contents may grow as additional modules are implemented.

7. Request Flow

A typical protected request follows this flow:

Frontend
|
| HTTP request
v
Express Route
|
v
authenticate middleware
|
| verifies JWT
v
req.user populated
|
v
authorize middleware
|
| checks role
v
Controller
|
v
Service / Model
|
v
MongoDB
|
v
DTO
|
v
JSON response
|
v
Frontend

This separation is important.

Frontend developers should not bypass authentication or role checks.

8. Authentication

HotelOS uses JWT-based authentication.

Login endpoint:

POST /api/v1/auth/login

Body:

{
"username": "your_username",
"password": "your_password"
}

Successful response contains:

{
"success": true,
"message": "Login successful",
"data": {
"token": "JWT_TOKEN",
"user": {
"id": "...",
"name": "...",
"username": "...",
"role": "...",
"hotelId": "...",
"roomId": null,
"mustChangePassword": true
}
}
}

The frontend should store the access token according to the
application's security policy and attach it to protected API requests.

9. Bearer Token

Protected requests use:

Authorization: Bearer <JWT_TOKEN>

In Requestly/Postman:

Authorization
Type: Bearer Token
Token: <JWT_TOKEN>

For frontend applications, the same concept applies:

Authorization: Bearer ${accessToken}

Do not send the token inside the JSON body.

Do not send:

{
"token": "..."
}

unless a specific endpoint explicitly requires it.

10. Roles

HotelOS currently uses roles including:

SUPER_ADMIN
SUB_ADMIN
RECEPTIONIST
KITCHEN
GUEST

The exact permissions should always be enforced by the backend.

The frontend should use the role received from login to determine which
dashboard/UI to display, but frontend role checks are not a security
boundary.

The backend must always verify authorization.

11. Role Hierarchy

SUPER_ADMIN

Global platform-level administrator.

Responsibilities include:

Create hotels.

Create/manage Sub Admin accounts.

Manage global hotel configuration.

Perform platform-level operations.

A Super Admin can work across hotels where the backend explicitly
permits it.

SUB_ADMIN

Hotel-level administrator.

A Sub Admin is associated with one hotel through:

req.user.hotelId

Responsibilities include hotel-level management such as:

Manage hotel operations.

Manage room allocation/configuration.

Create Kitchen users.

Create Receptionist users.

View users belonging to their hotel.

Manage hotel-level operational settings.

A Sub Admin must not be able to operate on another hotel's data.

RECEPTIONIST

Front-desk operational role.

The intended workflow is:

Guest arrives
|
v
Reception checks guest details
|
v
Guest account is created/managed
|
v
Room is assigned
|
v
Check-in
|
v
Guest uses Guest Dashboard

Guest account creation should happen through the Reception workflow, not
through the Sub Admin's generic staff-user creation endpoint.

KITCHEN

Kitchen operational role.

Kitchen users work with kitchen-related modules such as:

Food orders

Order status

Food preparation

Kitchen queue

Relevant service requests

The Kitchen frontend should only depend on APIs explicitly assigned to
the Kitchen role.

GUEST

Guest-facing role.

A guest account represents an actual hotel guest.

The Guest frontend may eventually consume APIs for:

Room information

Orders

Food

Service requests

Hotel services

Guest profile

Booking/check-in information

Guest creation should be tied to the Reception/check-in workflow.

12. Hotel Isolation

This is one of the most important security rules in HotelOS.

A Sub Admin belongs to one hotel.

Example:

Sub Admin A
hotelId = HOTEL_A

If Sub Admin A calls:

POST /api/v1/users

the backend determines:

const hotelId = req.user.hotelId;

The frontend should NOT be allowed to choose:

{
"hotelId": "HOTEL_B"
}

Even if a malicious frontend sends:

{
"name": "Kitchen User",
"role": "KITCHEN",
"hotelId": "HOTEL_B"
}

the backend must ignore that value.

The backend uses:

Authenticated JWT
|
v
req.user.hotelId
|
v
MongoDB record

This is the correct multi-tenant isolation pattern.

13. User Creation

Endpoint:

POST /api/v1/users

This endpoint is protected.

Current intended authorization:

SUB_ADMIN

and the backend restricts the roles that can be created through this
endpoint.

Currently:

KITCHEN
RECEPTIONIST

are valid operational staff roles.

Example request:

{
"name": "Kitchen Operator"
}

or, depending on the current controller contract:

{
"name": "Kitchen Operator",
"role": "KITCHEN"
}

The backend generates credentials.

14. Credential Generation

Credential generation is implemented in:

src/utils/generateCredentials.js

The utility generates usernames such as:

grand-kitchen-001
grand-kitchen-002
grand-receptionist-001

and temporary passwords.

The username generator follows the concept:

generateUsername(hotelCode, role, number)

Example:

GRAND + KITCHEN + 001

becomes:

grand-kitchen-001

Temporary passwords are generated using Node's crypto functionality.

The API returns the temporary password when the account is initially
created.

Example:

{
"success": true,
"message": "User created successfully",
"data": {
"id": "...",
"name": "Kitchen Operator",
"username": "grand-kitchen-001",
"role": "KITCHEN",
"hotelId": "...",
"temporaryPassword": "..."
}
}

The temporary credential should be treated as sensitive.

15. Guest Account Creation

Do not use:

POST /api/v1/users

as the long-term Guest creation workflow.

The intended architecture is:

SUB_ADMIN
|
| manages rooms / hotel operations
v
RECEPTIONIST
|
| creates guest during check-in
v
GUEST

This keeps responsibilities clean.

A future Guest API should have a dedicated endpoint, for example:

/api/v1/guests

rather than treating guests as ordinary staff users.

The exact Guest API contract should be documented here when that module
is implemented.

16. Getting Users

Endpoint:

GET /api/v1/users

Requires authentication.

The current implementation allows authorized administrative roles to
retrieve users.

For a Sub Admin, the query is filtered using:

hotelId: req.user.hotelId

Therefore:

Sub Admin of Hotel A
|
v
GET /api/v1/users
|
v
Only Hotel A users

The backend should never rely on a frontend-provided hotel ID for this
filtering.

17. DTOs

HotelOS uses DTOs to avoid returning raw Mongoose documents directly.

User DTO:

src/dto/user.dto.js

The concept is:

export const userResponseDTO = (user) => ({
id: user._id,
name: user.name,
username: user.username,
role: user.role,
hotelId: user.hotelId,
roomId: user.roomId,
isActive: user.isActive
});

Instead of:

res.json(user);

use:

res.json({
success: true,
data: userResponseDTO(user)
});

For multiple users:

data: users.map(userResponseDTO)

Why DTOs matter

DTOs provide a stable API contract.

They prevent accidental exposure of database fields such as:

password
internal fields
Mongoose metadata

Frontend developers should build their UI against the documented DTO
response rather than assuming the complete MongoDB document is
available.

18. Standard Response Format

Successful responses generally follow:

{
"success": true,
"message": "Operation successful",
"data": {}
}

For errors:

{
"success": false,
"message": "Something went wrong"
}

Frontend developers should always check:

response.success

before assuming the operation succeeded.

19. HTTP Status Codes

Common statuses:

Status Meaning

200 Request successful
201 Resource successfully created
400 Invalid/missing request data
401 Authentication required/invalid credentials
403 Authenticated but not authorized
404 Resource/route not found
409 Duplicate/conflicting resource
500 Internal server error

Example:

401
Authentication required

means the frontend needs a valid access token.

Example:

403
You do not have permission

means the user is authenticated but their role cannot perform that
operation.

20. Authentication vs Authorization

These are different.

Authentication

Question:

Who are you?

Handled by:

authenticate

JWT is verified.

Authorization

Question:

Are you allowed to perform this operation?

Handled by:

authorize(...)

Example:

authorize("SUB_ADMIN")

means only a Sub Admin can proceed.

21. Logout

Current initial implementation follows a basic JWT approach.

Endpoint:

POST /api/v1/auth/logout

With basic JWT authentication, logout is primarily handled client-side
by removing the access token.

Frontend should:

User clicks Logout
|
v
Optional POST /api/v1/auth/logout
|
v
Delete access token locally
|
v
Redirect to Login

The initial implementation intentionally does not overcomplicate logout
with:

Refresh-token rotation

Device/session tracking

Token revocation database

Token blacklist

These can be added later for a production-grade session system.

22. Rooms

The planned API namespace is:

/api/v1/rooms

The Sub Admin's responsibility includes hotel-level room
management/allocation.

Important distinction:

SUB_ADMIN
|
| manages total rooms / room allocation
v
RECEPTIONIST
|
| assigns a room to a specific guest
v
GUEST

Do not mix room inventory management with Guest account creation.

The exact Room API contract should be documented here once the Room
controller/routes are implemented.

23. Orders

Planned API namespace:

/api/v1/orders

Likely consumers:

GUEST
KITCHEN
RECEPTION
SUB_ADMIN

depending on the specific operation.

A guest may create/order food.

Kitchen may update preparation/order status.

The backend must enforce role-specific permissions for each operation.

Do not assume that because a frontend can display a button, the user is
authorized to call the API.

24. Service Requests

Planned namespace:

/api/v1/service-requests

Example workflow:

Guest
|
| creates service request
v
Backend
|
v
Reception / relevant department
|
v
Request processed
|
v
Status updated

The exact request/status schema should be documented when implemented.

25. Food Items

Planned namespace:

/api/v1/food-items

This will support the food/kitchen system.

Potential frontend consumers:

Guest Dashboard
Kitchen Dashboard
Sub Admin Dashboard

The backend should define exactly which role can:

create food items

update food items

disable food items

view food items

change availability

before frontend implementation.

26. Frontend Integration Guide

Every frontend should have a centralized API configuration.

Example:

const API_BASE_URL = "http://localhost:5001/api/v1";

Then:

fetch(`${API_BASE_URL}/users`, {
headers: {
Authorization: `Bearer ${token}`,
"Content-Type": "application/json"
}
});

Do not scatter:

http://localhost:5001

throughout the frontend code.

Use one API configuration file.

For example:

src/
└── config/
└── api.js

or:

src/
└── services/
└── api.js

27. Recommended Frontend Structure

A frontend can use a structure such as:

src/
├── components/
├── pages/
├── services/
│ ├── auth.js
│ ├── users.js
│ ├── rooms.js
│ ├── orders.js
│ └── serviceRequests.js
├── context/
│ └── AuthContext.jsx
├── config/
│ └── api.js
└── App.jsx

Keep API calls in service files rather than putting large fetch/axios
calls directly inside UI components.

28. Login Flow for Frontend Developers

Example:

Login Page
|
| username + password
v
POST /api/v1/auth/login
|
v
Backend validates credentials
|
v
JWT generated
|
v
Frontend receives token + user
|
+----> store authenticated state
|
+----> inspect user.role
|
v
Redirect to correct dashboard

Example:

if (user.role === "SUB_ADMIN") {
navigate("/sub-admin");
}

if (user.role === "RECEPTIONIST") {
navigate("/reception");
}

if (user.role === "KITCHEN") {
navigate("/kitchen");
}

if (user.role === "GUEST") {
navigate("/guest");
}

These frontend checks are for navigation/UI only.

The backend remains responsible for security.

29. Token Handling

For protected API calls:

Authorization: Bearer <TOKEN>

Do not:

hard-code tokens in source code

commit tokens to Git

send another user's token

expose tokens in public logs

put JWTs in screenshots shared publicly

If a token is accidentally exposed, treat it as compromised and log in
again / rotate credentials as appropriate.

30. Testing with Requestly

The project has been tested using Requestly API Client.

Recommended Requestly organization:

HotelOS
│
├── Authentication
│ ├── Super Admin Login
│ ├── Sub Admin Login
│ └── Logout
│
├── Hotels
│ └── Create Hotel
│
├── Users
│ ├── Create Kitchen User
│ ├── Create Reception User
│ └── Get Users
│
├── Rooms
│
├── Orders
│
└── Service Requests

31. Testing Login

Request:

POST http://localhost:5001/api/v1/auth/login

Body:

{
"username": "your_username",
"password": "your_password"
}

A successful response contains:

{
"success": true,
"message": "Login successful",
"data": {
"token": "..."
}
}

Copy the token.

Use it as the Bearer token for protected requests.

32. Testing Sub Admin User Creation

First login as a Sub Admin.

Copy the JWT.

Then:

POST http://localhost:5001/api/v1/users

Authorization:

Bearer <SUB_ADMIN_TOKEN>

Body:

{
"name": "Kitchen Operator",
"role": "KITCHEN"
}

The backend generates:

username

temporary password

hotel ID

The frontend does not provide the hotel ID.

33. Testing Hotel Isolation

This is a critical security test.

Suppose:

Sub Admin A -> Hotel A

Try sending:

{
"name": "Test User",
"role": "KITCHEN",
"hotelId": "HOTEL_B"
}

The backend should still assign:

Hotel A

because it uses:

req.user.hotelId

rather than trusting the body.

34. Testing Get Users

Request:

GET http://localhost:5001/api/v1/users

Authorization:

Bearer <SUB_ADMIN_TOKEN>

No body is required.

Expected:

{
"success": true,
"data": []
}

The response should contain DTO fields rather than raw MongoDB
documents.

Passwords must not be returned.

35. Testing with curl

Health:

curl http://localhost:5001/api/v1/health

Login:

curl -X POST http://localhost:5001/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{
"username": "your_username",
"password": "your_password"
}'

Protected request:

curl http://localhost:5001/api/v1/users \
-H "Authorization: Bearer YOUR_TOKEN"

Create staff user:

curl -X POST http://localhost:5001/api/v1/users \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_SUB_ADMIN_TOKEN" \
-d '{
"name": "Kitchen Operator",
"role": "KITCHEN"
}'

36. Common Errors

401 Authentication required

Usually means:

no Authorization header

invalid JWT

expired JWT

Check:

Authorization: Bearer <token>

403 You do not have permission

Authentication worked, but the user's role is not allowed.

For example:

KITCHEN

trying to access an endpoint restricted to:

SUB_ADMIN

404 Cannot POST /api/v1/users

Check:

Is user.routes.js imported?

Is it mounted in app.js?

Is the URL correct?

Is the HTTP method correct?

Is the server running?

The app should contain something equivalent to:

app.use("/api/v1/users", userRoutes);

500 Failed to create user

Check the backend terminal.

Do not rely only on the frontend error message.

The backend logs the actual exception.

37. Important Security Rules

Rule 1 --- Never trust frontend hotel IDs

Bad:

const { hotelId } = req.body;

for Sub Admin hotel ownership.

Good:

const hotelId = req.user.hotelId;

Rule 2 --- Never return passwords

Never do:

res.json(user);

Use DTOs.

Rule 3 --- Never rely only on frontend authorization

A frontend may hide:

Delete button

but a malicious user can still manually call the API.

Therefore the backend must enforce:

authenticate +
authorize

Rule 4 --- Never hard-code production secrets

Do not commit:

JWT_SECRET
MONGODB_URI
database passwords
real tokens

Rule 5 --- Do not mix Guest and Staff creation

Staff:

SUB_ADMIN -> KITCHEN / RECEPTIONIST

Guest:

RECEPTIONIST -> GUEST

Keep these workflows separate.

38. API Contract for Frontend Developers

Before building a frontend feature, identify:

1. HTTP method
2. URL
3. Authentication requirement
4. Allowed role
5. Request body
6. Response body
7. Error responses

For example:

Feature: Create Kitchen User

Method:
POST

URL:
/api/v1/users

Authentication:
Required

Role:
SUB_ADMIN

Body:
{
"name": "Kitchen Operator",
"role": "KITCHEN"
}

Hotel ID:
NOT PROVIDED BY FRONTEND

Backend:
req.user.hotelId

Response:
{
"success": true,
"message": "User created successfully",
"data": {...}
}

This format should be followed for future endpoints.

39. Frontend Ownership by Dashboard

Super Admin Dashboard

Main backend areas:

Authentication
Hotels
Sub Admin management
Global administration

Sub Admin Dashboard

Main backend areas:

Authentication
Hotel information
Rooms
Room allocation/configuration
Kitchen user management
Reception user management
Hotel-level users

Reception Dashboard

Main backend areas:

Authentication
Guests
Check-in
Check-out
Room assignment
Guest information
Guest service requests
Relevant orders

Guest accounts should be created as part of the Reception/guest
workflow.

Kitchen Dashboard

Main backend areas:

Authentication
Food items
Orders
Order status
Kitchen queue
Relevant service requests

Guest Dashboard

Main backend areas:

Authentication
Guest profile
Room information
Food menu
Orders
Service requests
Order/request status
Hotel services

40. Recommended Development Workflow

When implementing a new feature:

1. Define database model
   |
   v
2. Define request/response contract
   |
   v
3. Create DTO
   |
   v
4. Create controller/service
   |
   v
5. Add authentication
   |
   v
6. Add authorization
   |
   v
7. Add route
   |
   v
8. Mount route in app.js
   |
   v
9. Test with Requestly/curl
   |
   v
10. Give frontend developer the API contract
    |
    v
11. Build frontend integration

Do not build the frontend API integration before the backend contract is
clear.

41. Adding a New Module

Suppose we add Rooms.

Create:

src/models/Room.js
src/controllers/room.controller.js
src/routes/room.routes.js
src/dto/room.dto.js

Then mount:

app.use("/api/v1/rooms", roomRoutes);

The frontend can then use:

GET /api/v1/rooms
POST /api/v1/rooms
PUT /api/v1/rooms/:id
DELETE /api/v1/rooms/:id

Only implement operations that are actually required and authorized.

42. Do Not Assume an Endpoint Exists

Frontend developers should not invent API URLs.

For example, do not assume:

/api/v1/guest/login

exists unless it has been implemented.

Check the backend routes first.

The same applies to:

/api/v1/rooms
/api/v1/orders
/api/v1/service-requests
/api/v1/food-items

These namespaces are part of the planned HotelOS API architecture and
should be treated as available only after their backend implementation
is complete.

43. Current API Foundation

The current backend foundation includes:

✅ Express server
✅ MongoDB connection
✅ API v1 namespace
✅ JWT authentication
✅ Role-based authorization
✅ Super Admin seed
✅ Hotel creation foundation
✅ Sub Admin creation
✅ Sub Admin login
✅ Protected user endpoints
✅ Sub Admin hotel isolation
✅ Kitchen user creation
✅ Receptionist user creation
✅ Automatic staff credential generation
✅ DTO-based user responses
✅ Basic logout endpoint

The following areas are part of the broader HotelOS roadmap and should
be completed/documented as their APIs are implemented:

⏳ Rooms
⏳ Guest management
⏳ Check-in/check-out
⏳ Orders
⏳ Food items
⏳ Service requests
⏳ Advanced session management

44. Production Improvements

The initial backend intentionally keeps authentication simple.

For a production-grade deployment, consider adding:

Refresh tokens

Refresh-token rotation

Session/device tracking

Token revocation

Rate limiting

Request validation

Centralized error handling

Audit logs

Password reset

Email verification

Stronger credential delivery

Security headers

Request logging

Database indexes

Pagination

API documentation/OpenAPI

Automated tests

Automated deployment

Environment-specific configuration

These should be added incrementally rather than overcomplicating the
initial foundation.

45. API Documentation Checklist

Whenever a new endpoint is added, update the README with:

Endpoint
HTTP method
Authentication
Allowed roles
Request body
Path parameters
Query parameters
Success response
Error responses
Example frontend request

Example:

POST /api/v1/example

Authentication:
Bearer JWT

Roles:
SUB_ADMIN

Body:
{
"name": "Example"
}

Response:
{
"success": true,
"message": "Created successfully",
"data": {}
}

This keeps the backend handoff clean for every frontend developer.

46. Golden Rules for Frontend Developers

Before integrating any HotelOS API, remember:

Always use /api/v1/.

Login first for protected APIs.

Send the JWT as a Bearer token.

Never send a hotel ID when the backend derives it from the
authenticated user.

Never assume frontend role checks provide security.

Do not expect passwords in API responses.

Use the documented DTO fields.

Check success and HTTP status.

Handle 401 by requiring authentication again.

Handle 403 as a permissions problem.

Keep API calls in a dedicated service layer.

Do not invent endpoints that are not implemented.

Keep Guest and Staff workflows separate.

Ask the backend developer for the API contract before integrating a
new feature.

47. Quick Reference

Base URL

http://localhost:5001/api/v1

Authentication

POST /auth/login
POST /auth/logout

Hotels

GET /hotels
POST /hotels

Use the currently implemented route/controller contract as the source of
truth for exact permissions and fields.

Users

GET /users
POST /users

Planned/expanding modules

/rooms
/guests
/orders
/service-requests
/food-items

48. Final Architecture

The overall HotelOS backend direction is:

                         HOTEL OS BACKEND
                                |
                +---------------+---------------+
                |               |               |
             AUTH             USERS           HOTELS
                |               |               |
             JWT/RBAC       DTOs/Roles      Multi-hotel
                |               |
                |         +-----+-----+
                |         |           |
                |       STAFF       GUESTS
                |         |           |
                |    +----+----+      |
                |    |         |      |
                | Kitchen  Reception  |
                |              |      |
                |              +------+
                |                 |
                +-----------------+
                          |
                    HOTEL OPERATIONS
                          |
             +------------+-------------+
             |            |             |
           ROOMS        ORDERS       REQUESTS
             |            |             |
             +------------+-------------+
                          |
                     FRONTENDS
                          |
       +----------+-------+-------+----------+
       |          |               |          |

Super Admin Sub Admin Reception Kitchen
|
Guest

The most important architectural principle is:

The frontend decides what to display. The backend decides what the
user is actually allowed to do.

That principle should remain true for every future HotelOS module.

49. For New Developers

If you are joining the project for the first time, follow this order:

1. Read this README completely.
2. Run the backend locally.
3. Test /api/v1/health.
4. Test Super Admin login.
5. Test Sub Admin login.
6. Copy a valid JWT.
7. Test one protected endpoint.
8. Understand the role hierarchy.
9. Understand hotel isolation.
10. Read the relevant controller and route.
11. Test the API in Requestly/Postman.
12. Only then start the frontend integration.

Do not start by guessing API URLs.

The backend routes and controller contracts are the source of truth.

Maintainers

HotelOS Backend

For changes to API behavior, update:

Backend implementation

API tests

This README

Frontend integration documentation where necessary

Keep the API contract stable whenever possible.
