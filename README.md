# Liflow FE

Liflow FE is the customer and admin frontend for **Liflow / 주왕몰**, a premium Korean food shopping website operated by 농업회사법인 라이플로우(주). The site helps customers discover curated Korean ingredients, traditional seasonings, recipes, special offers, and service content, while also supporting the commerce flow from product browsing through cart, checkout, payment, and account management.

The project also includes a full admin experience for managing products, banners, coupons, orders, members, roles, permissions, announcements, community recipes, product inquiries, chats, and policy pages.

## Website Highlights

- Korean food ecommerce storefront with home, market, special offers, contents, service, notice, and policy pages
- Product detail pages with reviews and customer inquiries
- Cart, checkout, Toss Payments integration, coupons, delivery address, and order result pages
- Customer account area for profile information, orders, points, addresses, and saved recipes
- Recipe and community features, including customer-created posts and comments
- Admin dashboard for day-to-day store operations and content management
- Realtime-oriented features through SSE, chat sockets, Firebase Cloud Messaging, and PWA support
- SEO and app metadata for `liflow.co.kr` / 주왕몰, including sitemap, robots, Open Graph, and web app manifest

## Tech Stack

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript
- **UI:** React 19, Tailwind CSS 4, Radix UI, lucide-react
- **Data fetching:** Axios, TanStack React Query
- **Forms and validation:** React Hook Form, Zod
- **Payments:** Toss Payments SDK
- **Notifications:** Firebase Cloud Messaging
- **Realtime:** Socket.IO client and Server-Sent Events
- **Deployment:** Docker-ready Next.js production build

## Main Routes

| Area | Routes |
| --- | --- |
| Storefront | `/`, `/market`, `/special`, `/contents`, `/service`, `/notice` |
| Products | `/products/[id]`, `/products/[id]/inquiry-create` |
| Community | `/community/create`, `/community/main/[id]` |
| Auth | `/sign-in`, `/sign-up`, `/find-id`, `/find-password` |
| Shopping | `/cart`, `/orders/create`, `/orders/create/success`, `/orders/create/fail` |
| My Page | `/my-page`, `/my-page/orders`, `/my-page/points`, `/my-page/address`, `/my-page/recipe`, `/my-page/information` |
| Policies | `/policy/privacy-policy`, `/policy/terms-of-service`, `/policy/[slug]` |
| Admin | `/admin`, `/admin/sign-in`, `/admin/products`, `/admin/orders`, `/admin/members`, `/admin/roles`, `/admin/permissions`, `/admin/coupons`, `/admin/banner-management`, `/admin/community`, `/admin/announcement`, `/admin/product-inquiries`, `/admin/chats`, `/admin/policy-management` |

## Project Structure

```text
app/          Next.js App Router pages, layouts, metadata, API routes, and admin screens
components/   Shared UI, layout, storefront, account, and admin components
entities/     TypeScript entity models for backend resources
hooks/        API hooks, DTOs, auth, cart, order, payment, chat, FCM, and domain logic
lib/          Axios, Firebase, admin mock data, and shared utilities
public/       Images, icons, PWA assets, and service worker files
styles/       Global style entry points
utils/        Shared helper utilities
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root with the variables below:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3500/api/v1

NEXT_PUBLIC_NAVER_CLIENT_ID=
NEXT_PUBLIC_NAVER_REDIRECT_URI=http://localhost:3001/sign-in

NEXT_PUBLIC_TOSS_CLIENT_KEY=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_WS_URL=
```

Run the development server:

```bash
npm run dev
```

The app runs on:

```text
http://localhost:3001
```

## Available Scripts

```bash
npm run dev        # Start Next.js on port 3001
npm run dev:3001   # Start with a dedicated .next-3001 build directory
npm run dev:3002   # Start on port 3002 with a dedicated .next-3002 build directory
npm run dev:clean  # Remove .next and start development server
npm run dev:poll   # Start with polling enabled for file watching
npm run build      # Build production assets
npm run start      # Start the production server
npm run lint       # Run ESLint
```

## Docker

Build the image:

```bash
docker build -t liflow-fe .
```

Run the container:

```bash
docker run -p 3000:3000 liflow-fe
```

For production deployments, provide real environment values through your deployment platform instead of committing secrets or private configuration into the repository.

## Notes

- The app expects a backend API at `NEXT_PUBLIC_API_URL`.
- Auth tokens are read from cookies and attached to API requests automatically.
- On `401` or `403` responses, auth cookies are cleared and users are redirected to the correct sign-in page.
- Firebase configuration is required only for push notification and messaging features.
- Toss Payments requires `NEXT_PUBLIC_TOSS_CLIENT_KEY` for checkout.
- Naver login requires `NEXT_PUBLIC_NAVER_CLIENT_ID` and `NEXT_PUBLIC_NAVER_REDIRECT_URI`.
