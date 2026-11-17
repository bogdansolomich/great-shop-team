# Wearly Shop (Great Shop)

Інтернет-магазин: вітрина на Next.js і API на Django REST.

```text
great-shop-team/
  frontend/   Next.js 16, React 19, RTK Query
  backend/    Django REST, Postgres, Redis, Docker
```

Секрети (`.env`, `.env.local`) у git не потрапляють. У бекенді є `.env.example`, у фронтенді — `frontend/.env.example`.

## Backend

```bash
cd backend
cp .env.example .env   # Windows: copy .env.example .env
docker compose up --build --force-recreate
```

Після старту:

```bash
make seed
make superuser
```

| Сервіс | URL |
| --- | --- |
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/api/schema/swagger-ui/ |
| Django admin | http://localhost:8080/admin/ |

Детальніше: [`backend/README.md`](backend/README.md).

## Frontend

```bash
cd frontend
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm install
npm run dev
```

Відкрий [http://localhost:3000](http://localhost:3000).

Для локального API залиш `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`. Для staging-бекенду можна поставити `https://wearlyshop.onrender.com`.

Детальніше: [`frontend/README.md`](frontend/README.md).
