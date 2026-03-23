# Run Instructions

## Backend (Spring Boot)

1. Open terminal in `demo`.
2. Ensure JDK 21 and Maven are available.
3. Run:

```powershell
mvn spring-boot:run
```

Backend URL: http://localhost:8080
Swagger UI: http://localhost:8080/swagger-ui.html

## Frontend (React + Vite)

1. Open terminal in `frontend`.
2. Install dependencies:

```bash
npm install
```

3. Start dev server:

```bash
npm run dev
```

Frontend URL: http://localhost:5173

## WebSocket

- Endpoint: `ws://localhost:8080/ws/editor`
- Topic subscription: `/topic/project/{projectId}`
- Client publish destination: `/app/project/{projectId}/edit`
