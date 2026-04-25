# Doctor Appointment System - API Documentation

## Base URL
```
Development: http://localhost:5000/api/v1
Production: https://api.doctorappointment.com/api/v1
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success message",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Authentication Endpoints

### 1. Register User (Patient)
**POST** `/auth/register/user`

Register a new patient account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "bloodGroup": "O+"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### 2. Register Doctor
**POST** `/auth/register/doctor`

Register a new doctor account (requires admin verification).

**Request Body:**
```json
{
  "firstName": "Dr. Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "9876543211",
  "password": "password123",
  "dateOfBirth": "1985-05-20",
  "gender": "female",
  "specialization": "Cardiologist",
  "registrationNumber": "MED123456",
  "experience": 10,
  "consultationFee": 500,
  "clinicAddress": {
    "clinicName": "Heart Care Clinic",
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  }
}
```

**Response:** `201 Created`

---

### 3. Login
**POST** `/auth/login`

Login for both users and doctors.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### 4. Refresh Token
**POST** `/auth/refresh-token`

Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`

---

### 5. Logout
**POST** `/auth/logout`

Logout current user (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

---

### 6. Get Current User
**GET** `/auth/me`

Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

---

### 7. Update Password
**PATCH** `/auth/update-password`

Update user password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response:** `200 OK`

---

## Doctor Endpoints

### 1. Get All Doctors
**GET** `/doctors`

Get list of all verified doctors with filters.

**Query Parameters:**
- `specialization` (optional): Filter by specialization
- `city` (optional): Filter by city
- `minFee` (optional): Minimum consultation fee
- `maxFee` (optional): Maximum consultation fee
- `rating` (optional): Minimum rating
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `search` (optional): Search by name

**Example:**
```
GET /doctors?specialization=Cardiologist&city=Mumbai&page=1&limit=10
```

**Response:** `200 OK` (Paginated)

---

### 2. Get Doctor by ID
**GET** `/doctors/:id`

Get detailed information about a specific doctor.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Doctor retrieved successfully",
  "data": {
    "_id": "...",
    "firstName": "Dr. Jane",
    "lastName": "Smith",
    "specialization": "Cardiologist",
    "experience": 10,
    "consultationFee": 500,
    "rating": {
      "average": 4.5,
      "count": 120
    },
    "clinicAddress": { },
    "qualifications": [],
    "availability": []
  }
}
```

---

### 3. Get Doctor Available Slots
**GET** `/doctors/:id/slots`

Get available time slots for a doctor.

**Query Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)

**Example:**
```
GET /doctors/123/slots?startDate=2024-01-15&endDate=2024-01-20
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Slots retrieved successfully",
  "data": [
    {
      "_id": "...",
      "date": "2024-01-15",
      "startTime": "09:00",
      "endTime": "09:30",
      "status": "available"
    }
  ]
}
```

---

### 4. Update Doctor Profile
**PUT** `/doctors/profile`

Update doctor profile (requires doctor authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "about": "Experienced cardiologist...",
  "consultationFee": 600,
  "clinicAddress": { }
}
```

**Response:** `200 OK`

---

### 5. Set Doctor Availability
**POST** `/doctors/availability`

Set weekly availability schedule (requires doctor authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "availability": [
    {
      "dayOfWeek": 1,
      "slots": [
        {
          "startTime": "09:00",
          "endTime": "12:00"
        },
        {
          "startTime": "14:00",
          "endTime": "18:00"
        }
      ]
    }
  ]
}
```

**Response:** `200 OK`

---

## Appointment Endpoints

### 1. Book Appointment
**POST** `/appointments/book`

Book a new appointment (requires user authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "doctorId": "...",
  "slotId": "...",
  "symptoms": "Chest pain and shortness of breath",
  "notes": "History of hypertension"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "_id": "...",
    "appointmentNumber": "APT240115000001",
    "patient": "...",
    "doctor": "...",
    "appointmentDate": "2024-01-15",
    "appointmentTime": "09:00",
    "status": "pending",
    "paymentStatus": "pending",
    "consultationFee": 500
  }
}
```

---

### 2. Get User Appointments
**GET** `/appointments`

Get all appointments for current user (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, confirmed, cancelled, completed)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `200 OK` (Paginated)

---

### 3. Get Appointment Details
**GET** `/appointments/:id`

Get detailed information about a specific appointment.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

---

### 4. Cancel Appointment
**PATCH** `/appointments/:id/cancel`

Cancel an appointment (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reason": "Personal emergency"
}
```

**Response:** `200 OK`

---

### 5. Complete Appointment
**PATCH** `/appointments/:id/complete`

Mark appointment as completed (requires doctor authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "prescription": {
    "medicines": [
      {
        "name": "Aspirin",
        "dosage": "75mg",
        "frequency": "Once daily",
        "duration": "30 days",
        "instructions": "Take after breakfast"
      }
    ],
    "diagnosis": "Mild hypertension",
    "advice": "Regular exercise and low-salt diet",
    "followUpDate": "2024-02-15"
  }
}
```

**Response:** `200 OK`

---

### 6. Add Rating
**POST** `/appointments/:id/rating`

Add rating and review for completed appointment (requires user authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "score": 5,
  "review": "Excellent doctor, very professional and caring"
}
```

**Response:** `200 OK`

---

## Payment Endpoints

### 1. Create Payment Order
**POST** `/payments/create`

Create a payment order for an appointment.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "appointmentId": "..."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Payment order created",
  "data": {
    "payment": { },
    "razorpayOrder": {
      "id": "order_...",
      "amount": 50000,
      "currency": "INR"
    },
    "key": "rzp_test_..."
  }
}
```

---

### 2. Verify Payment
**POST** `/payments/verify`

Verify payment after successful transaction.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

**Response:** `200 OK`

---

### 3. Payment Webhook
**POST** `/payments/webhook`

Webhook endpoint for payment gateway callbacks.

**Headers:**
```
X-Razorpay-Signature: <signature>
```

**Response:** `200 OK`

---

## Notification Endpoints

### 1. Get Notifications
**GET** `/notifications`

Get all notifications for current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `200 OK` (Paginated)

---

### 2. Mark as Read
**PATCH** `/notifications/:id/read`

Mark a notification as read.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

---

### 3. Mark All as Read
**PATCH** `/notifications/read-all`

Mark all notifications as read.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

---

### 4. Get Unread Count
**GET** `/notifications/unread-count`

Get count of unread notifications.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Unread count retrieved",
  "data": {
    "count": 5
  }
}
```

---

## Admin Endpoints

### 1. Get All Users
**GET** `/admin/users`

Get all registered users (requires admin authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`, `limit`, `search`, `isActive`

**Response:** `200 OK` (Paginated)

---

### 2. Verify Doctor
**PATCH** `/admin/doctors/:id/verify`

Verify or reject doctor profile (requires admin authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "isVerified": true,
  "rejectionReason": ""
}
```

**Response:** `200 OK`

---

### 3. Get Analytics
**GET** `/admin/analytics`

Get system analytics and statistics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `startDate`, `endDate`

**Response:** `200 OK`

---

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_access_token'
  }
});
```

### Events

#### Client → Server
- `join:appointment` - Join appointment room
- `leave:appointment` - Leave appointment room
- `join:doctor` - Join doctor room for slot updates
- `leave:doctor` - Leave doctor room

#### Server → Client
- `connected` - Connection confirmation
- `notification` - New notification
- `notification:update` - Notification update
- `slot:update` - Slot availability update
- `appointment:update` - Appointment status update

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limits

- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- Booking: 10 requests per hour
- OTP: 3 requests per 15 minutes

---

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123",
    "dateOfBirth": "1990-01-15",
    "gender": "male"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Doctors
```bash
curl -X GET "http://localhost:5000/api/v1/doctors?city=Mumbai&specialization=Cardiologist"
```

### Book Appointment
```bash
curl -X POST http://localhost:5000/api/v1/appointments/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "doctorId": "DOCTOR_ID",
    "slotId": "SLOT_ID",
    "symptoms": "Chest pain"
  }'
```

---

## Postman Collection

Import the Postman collection for easy API testing:
[Download Postman Collection](./postman_collection.json)

---

## Support

For API support and questions:
- Email: api-support@doctorappointment.com
- Documentation: https://docs.doctorappointment.com
