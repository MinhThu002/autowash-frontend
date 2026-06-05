# AutoWash Pro Mock API

Mock API nằm trong `assets/js/mock-api.js` và tự intercept các request `fetch('/api/...')`.

## Endpoint theo backend Spring Boot

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/customers/profile?customerId=1`
- `GET /api/vehicles/customer?customerId=1`
- `POST /api/vehicles`
- `PUT /api/vehicles/{id}`
- `DELETE /api/vehicles/{id}`
- `GET /api/admin/wash-services`
- `POST /api/admin/wash-services`
- `PUT /api/admin/wash-services/{id}`
- `DELETE /api/admin/wash-services/{id}`
- `GET /api/admin/time-slots`
- `POST /api/admin/time-slots`
- `PUT /api/admin/time-slots/{id}`
- `DELETE /api/admin/time-slots/{id}`
- `GET /api/promotions`
- `POST /api/promotions`
- `PUT /api/promotions/{id}`
- `DELETE /api/promotions/{id}`

## Ví dụ

```js
const auth = await AutoWashAPI.auth.login('customer@mail.com', '123456');
const vehicles = await AutoWashAPI.vehicles.byCustomer(1);
const services = await AutoWashAPI.washServices.list();
```

Backend thật hiện chưa có `BookingController` implementation, nên mock có thêm endpoint demo:

- `GET /api/bookings`
- `POST /api/bookings`
- `PATCH /api/bookings/{id}/status`
- `GET /api/staff/schedule`
- `PATCH /api/staff/schedule/{id}/status`

