# Great Shop

A modern e-commerce frontend built with Next.js App Router, TypeScript, SCSS, Tailwind CSS, and Redux Toolkit.

## 🚀 Project Overview

This repository contains the frontend for a shop application. The architecture separates UI, feature logic, and global state so contributors can quickly understand where code should live.

## ✅ Stack

- Next.js App Router
- React 19 + TypeScript
- SCSS modules + global styles
- Tailwind CSS (utility-first)
- Redux Toolkit + RTK Query

## 📂 Project Structure

```
src/
├── app/                  # Next.js App Router routes and layouts
│   ├── layout.tsx        # Main shell (Header, Footer, Providers)
│   ├── page.tsx          # Home page
│   └── (auth)/           # Auth-related routes
│   └── (dashboard)/      # User dashboard / admin area
│   └── (product)/        # Product pages
│   └── (public)/         # Public pages
├── features/             # Feature modules with isolated business logic
│   └── cart/             # Example feature: cart functionality
│       ├── ui/           # Cart UI components (CartButton, CartModal)
│       └── model/        # Types, actions and helpers for cart
├── widgets/              # Reusable UI blocks and components
│   └── product-card/     # Product card used across catalog and recommendations
├── store/                # Redux Toolkit and RTK Query setup
│   ├── store.ts          # Store configuration
│   ├── api.ts            # RTK Query endpoints and API service
│   └── hooks.ts          # Typed hooks: useAppDispatch, useAppSelector
├── styles/               # Global SCSS, variables and mixins
└── data/                 # Static JSON data used by UI components
```

## 📌 Key folders

- `src/app/` — app layouts, routes, and page entry points
- `src/features/` — feature-specific logic and local UI modules
- `src/widgets/` — reusable visual components across the app
- `src/store/` — global state, reducers, and API requests
- `src/styles/` — shared styles, variables, and SCSS setup

## ⚙️ Setup

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 📦 Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve built app
- `npm run lint` — run ESLint
- `npm run format` — format code with Prettier

## 🧠 Redux Toolkit + RTK Query

Redux is configured in this project with an RTK Query API layer. Key files:

- `src/store/store.ts` — store configuration, reducers and middleware
- `src/store/api.ts` — RTK Query API service and endpoints
- `src/store/slices/userSlice.ts` — sample slice for user/auth state
- `src/app/providers.tsx` — wraps the app with `<Provider store={store}>`
- `src/store/hooks.ts` — typed hooks for `useAppDispatch` and `useAppSelector`

### Example usage

Fetch data with RTK Query:

```tsx
import { useGetProductsQuery } from '@/store/api';

const { data, error, isLoading } = useGetProductsQuery();
```

Read and update global state using typed hooks:

```tsx
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser, logout } from '@/store/slices/userSlice';

const dispatch = useAppDispatch();
const user = useAppSelector((state) => state.user.profile);
```

> Tip: Always use `useAppDispatch` and `useAppSelector` from `src/store/hooks.ts` instead of the raw `useDispatch`/`useSelector` from `react-redux`.

## 🛠 How to extend the app

Use this guide when adding a new feature, page, or shared behavior.

### Start with the route

- Add a new page under `src/app/`.
  - Example: `src/app/about/page.tsx`
- Create a route layout only when needed.
  - Example: `src/app/product/[id]/layout.tsx`

### Feature structure

- Put feature-specific components and logic in `src/features/<feature>/`.
- Use `src/features/<feature>/ui/` for feature UI components.
- Use `src/features/<feature>/model/` for types, helpers, and local logic.
- If a component is reusable across the app, move it to `src/widgets/`.

### Shared state and API

- Add shared Redux state to `src/store/slices/<sliceName>.ts` only when multiple pages or features need it.
- Add backend calls to `src/store/api.ts` as RTK Query endpoints.

### Naming conventions

- Pages: `src/app/<route>/page.tsx`
- Layouts: `src/app/<route>/layout.tsx`
- Features: `src/features/<feature>/`
- Widgets: `src/widgets/<component>/`
- Store slices: `src/store/slices/<sliceName>.ts`

### Example extension flow

- Create `src/app/reviews/page.tsx`
- Add feature UI in `src/features/reviews/ui/`
- Add types/helpers in `src/features/reviews/model/`
- Add endpoint in `src/store/api.ts`
- Add slice in `src/store/slices/reviewsSlice.ts` if needed

## 🧩 widgets vs features (short)

- `widgets/`: self-contained UI building blocks (Header, ProductGrid).
- `features/`: user-facing functionality with business logic (AddToCartButton, AuthForm).

## ❗ Rules (what NOT to do)

- Do not import components directly from one feature into another. If code is shared, move it to `src/widgets/` or `src/shared/`.
- Always use typed `useAppDispatch` and `useAppSelector` from `src/store/hooks.ts` instead of raw `useDispatch`/`useSelector` from `react-redux`.
- Avoid inline styles (`style={{}}`). Use Tailwind for layout and SCSS modules for complex styles/animations.

## 🌿 Git workflow and branch naming (EN)

Follow this simple workflow to keep the repository tidy:

- Protected branches: `main` and `develop` — no direct commits; use Pull Requests.
- Work in feature branches created from `develop` (or `main` if you use trunk-based flow).
- Keep commits small and descriptive; open PRs for review.

### Branch name conventions

- `feature/<short-description>` — new feature (e.g. `feature/cart-page`)
- `fix/<short-description>` — bug fix (e.g. `fix/login-error`)
- `chore/<short-description>` — maintenance, dependency updates (e.g. `chore/update-deps`)
- `hotfix/<short-description>` — emergency production fix

### Workflow example

```bash
# create branch from develop
git checkout develop
git pull
git checkout -b feature/my-new-feature

# work, commit, lint
npm run lint
git add .
git commit -m "feature: add my-new-feature"

# push and open PR to develop
git push -u origin feature/my-new-feature
```

### PR checklist

- Small and focused commits
- Linted and formatted code (`npm run lint`)
- Add or update unit tests if applicable
- Assign reviewers and add a clear PR description

## 📚 Useful links

- [Next.js Documentation](https://nextjs.org/docs)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🧾 Example PR template

**Title:** `feature/reviews-page`

**Description:**

- Added Reviews page at `/reviews`
- Created `src/features/reviews/` for feature logic
- Added RTK Query endpoint in `src/store/api.ts`
- Added typed Redux slice `src/store/slices/reviewsSlice.ts`

**Checklist:**

- [ ] Code compiles and passes `npm run lint`
- [ ] Page works in browser at the correct route
- [ ] New or updated logic is covered by tests if applicable
- [ ] No direct imports between feature folders
- [ ] Shared UI components are placed under `src/widgets/`

**Notes:**

- Leave extra details for reviewers here.

---
