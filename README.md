# AgroLink Hub

AgroLink Hub is a full-stack social commerce web application for farmers, small business sellers, creators, buyers, and platform admins. It combines a modern social feed with marketplace workflows so local agricultural communities can share content, build trust, sell products, manage orders, and get support from one workspace.

![AgroLink Hub landing background](Lisharefrontend/src/assets/backgrounds/commerce-farmfresh-market.png)

## What This Project Does

AgroLink Hub is not only a social media clone. The application is organized around real community and business workflows:

- Farmers and businesses can create business pages, publish products, manage inventory, and handle received orders.
- Buyers and regular users can browse the marketplace, add products to a persistent cart, place orders, review businesses, and follow sellers.
- Community users can post updates, upload media, react, comment, share, view stories/reels, save posts, and chat in real time.
- Admins can review accounts, moderate reports, manage roles, inspect support tickets, and keep the platform safe.
- Everyone can use profile pages, notifications, calendar reminders, support tickets, and account settings.

## Key Features

### Social Workspace

- Public authenticated feed with posts, images, videos, reactions, comments, shares, saves, and reports.
- Story and reel style content to keep users active in the platform.
- User profiles with cover images, profile photos, bio, XP/activity information, saved content, and network information.
- Follow and friend workflows, including discovery, requests, followers, and following.
- Real-time notifications for social and account activity.

### Real-Time Messaging

- Direct and group conversations.
- WebSocket based chat updates.
- Online/offline presence indicators.
- Typing status.
- Message reactions.
- Image/video/file attachments.
- Shared media and pinned link sections in the chat UI.

### Marketplace And Orders

- Product listing, filtering, search, categories, delivery methods, and sorting.
- Business profiles with products, owner details, ratings, and reviews.
- Persistent backend cart for buyer accounts.
- Direct order flow and cart checkout flow.
- Seller order management for business and farmer accounts.
- Order status pipeline: pending, accepted, processing, on the way, completed, and cancelled.

### Business Studio

- Business/farmer-only business page management.
- Product create/update/delete workflows.
- Seller analytics and order insights.
- Business profile presentation for buyers.
- Review and rating visibility.

### Platform Tools

- Auth with signup, login, OTP verification, forgot password, refresh token flow, and secure logout.
- Role-based routing for users, creators, business sellers, farmer sellers, and admins.
- Calendar events, meetings, birthdays, tasks, reminders, day/week/month views.
- Support center for tickets, admin replies, website reviews, and moderation messages.
- Admin command center for account status, user roles, reports, support tickets, and moderation views.

## Tech Stack

### Backend

- Java 25
- Spring Boot 4.0.2
- Spring Security
- Spring Data JPA / Hibernate
- PostgreSQL
- WebSocket/STOMP messaging
- JWT with cookie based access, refresh, and verify tokens
- Spring Mail for OTP and account emails
- Maven wrapper
- Lombok

### Frontend

- React 18
- Vite 6
- React Router
- Axios
- STOMP WebSocket client
- Custom modular CSS design system
- Local 4k visual assets for landing, commerce, calendar, admin, profile, support, and auth screens

## Repository Layout

```text
springboot-react-bondly-social-media-app/
  Lisharebackend/
    src/main/java/com/socialApp/Lishare/
      modules/
        business/      # admin, cart, orders, pages, products, reviews, support
        platform/      # auth, calendar, common security/user code
        social/        # posts, stories, chat, comments, follows, friends, notifications
    src/main/resources/
      application.yaml
      schema.sql
    .env.example
    pom.xml

  Lisharefrontend/
    src/
      assets/          # branding, 4k backgrounds, workspace images
      modules/
        business/      # marketplace, cart, orders, analytics, admin, business pages
        platform/      # routes, auth, shell, support, profile, calendar, shared UI
        social/        # feed, chat, friends, notifications
      dashboard-ui.css
      feed-card-reference.css
    .env.example
    package.json
```

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page with visitor assistant and platform reviews |
| `/login`, `/signup`, `/verify`, `/forgot-password` | Auth and account recovery |
| `/home` | Social feed, posts, stories, reels, reactions, comments |
| `/profile`, `/profile/:userId` | User profiles and profile content |
| `/friends` | Friend/follow discovery and requests |
| `/chat` | Real-time conversations |
| `/marketplace` | Product discovery and business profiles |
| `/cart` | Buyer cart and checkout |
| `/orders` | Buyer and seller order workflows |
| `/business` | Business/farmer seller studio |
| `/analytics` | Seller/admin analytics |
| `/calendar` | Events, tasks, meetings, birthdays, reminders |
| `/support` | User support tickets and website reviews |
| `/admin` | Admin command center |

## Roles

| Role | Main Access |
| --- | --- |
| `ROLE_USER` | Social feed, marketplace buying, cart, orders, support, chat |
| `ROLE_CREATOR` | Social content, creator account experience, cart, support, chat |
| `ROLE_BUSINESS` | Business page, product listing, seller orders, analytics |
| `ROLE_FARMER` | Farmer seller tools, product listing, seller orders, analytics |
| `ROLE_ADMIN` | Admin command center, users, moderation, support tickets |

Public signup does not create admin accounts. Admin accounts should be created through a controlled database/admin process.

## Environment Configuration

Secrets must stay outside git. The committed backend config reads from environment variables:

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/bodlyy_db}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:}
  mail:
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
jwt:
  secret: ${JWT_SECRET:}
```

Use `Lisharebackend/.env.example` and `Lisharefrontend/.env.example` as references. The backend imports `Lisharebackend/.env` automatically for local development through `application.yaml`, while deployment environments should provide the same values through their secret/config system.

Required backend variables:

```text
DB_URL=jdbc:postgresql://localhost:5432/bodlyy_db
DB_USERNAME=postgres
DB_PASSWORD=your_database_password
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_mail_app_password
JWT_SECRET=your_32_byte_or_longer_base64_secret
SERVER_PORT=8081
FILE_UPLOAD_DIR=uploads
APP_CORS_ALLOWED_ORIGINS=http://localhost:[*],http://127.0.0.1:[*]
```

Frontend variables:

```text
VITE_API_BASE_URL=http://localhost:8081
VITE_WS_URL=ws://localhost:8081/ws
```

Security note: if a real password, app password, token, or JWT secret was ever committed before this cleanup, rotate it. Removing it from the current file prevents future exposure, but old git history can still contain the previous value.

## Running Locally

### 1. Start PostgreSQL

Create a database that matches your `DB_URL`, for example:

```sql
CREATE DATABASE bodlyy_db;
```

### 2. Start Backend

PowerShell example:

```powershell
cd Lisharebackend
$env:DB_URL="jdbc:postgresql://localhost:5432/bodlyy_db"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="your_database_password"
$env:MAIL_USERNAME="your_email@example.com"
$env:MAIL_PASSWORD="your_mail_app_password"
$env:JWT_SECRET="replace_with_secure_base64_secret"
.\mvnw spring-boot:run
```

Backend default URL:

```text
http://localhost:8081
```

### 3. Start Frontend

```powershell
cd Lisharefrontend
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

If Vite chooses another port, use the URL printed by the terminal.

## Build And Verification

Frontend production build:

```powershell
cd Lisharefrontend
npm run build
```

Backend tests/build:

```powershell
cd Lisharebackend
.\mvnw test
.\mvnw clean package
```

Some backend tests may require PostgreSQL and environment variables, depending on the test profile.

## UI And Design System

The frontend uses shared UI components from:

```text
Lisharefrontend/src/modules/platform/common/ui/DashboardUI.jsx
```

The global design layers are:

```text
Lisharefrontend/src/index.css
Lisharefrontend/src/dashboard-ui.css
Lisharefrontend/src/feed-card-reference.css
```

`dashboard-ui.css` is the main professional polish layer. Together with `index.css` and `feed-card-reference.css`, it fixes the broad frontend issues that matter most for this project:

- Consistent AgroLink branding and logo rendering.
- Stronger farmer/business visual identity using local 4k image assets.
- Reduced pure-white card overload.
- Stable button/form sizing so controls do not jump or overlap.
- Calendar toolbar/grid no-overlap rules.
- Chat thread/input layout fixes.
- Marketplace, cart, order, business, admin, analytics, and support page polish.
- Responsive mobile behavior for shell navigation, profile, commerce, calendar, and chat.

Important visual assets:

```text
Lisharefrontend/src/assets/branding/agrolink-hub-logo.svg
Lisharefrontend/src/assets/backgrounds/commerce-farmfresh-market.png
Lisharefrontend/src/assets/backgrounds/commerce-greenfield-mist.png
Lisharefrontend/src/assets/backgrounds/commerce-golden-farm-road.png
Lisharefrontend/src/assets/workspace/calendar-greenhouse-4k.jpg
Lisharefrontend/src/assets/workspace/admin-workspace-blueprint-4k.jpg
Lisharefrontend/src/assets/workspace/insights-workspace-4k.jpg
Lisharefrontend/src/assets/workspace/support-center-office-4k.jpg
```

## Data And Upload Hygiene

Runtime uploads are application data, not source code. They are ignored by git:

```text
uploads/
**/uploads/
```

Local files under upload folders can remain on your machine for development, but they should not be committed. IDE files, logs, build folders, local env files, and private Spring profiles are also ignored.

## Production Notes

Before deploying:

- Set `COOKIE_SECURE=true` behind HTTPS.
- Set an explicit `COOKIE_DOMAIN` only when needed.
- Restrict `APP_CORS_ALLOWED_ORIGINS` to real frontend domains.
- Use a strong Base64 JWT secret.
- Use managed PostgreSQL credentials from the deployment secret store.
- Use a dedicated SMTP account or email provider secret.
- Store uploaded files in persistent storage, not inside the git repository.
- Run `npm run build` for the frontend and `mvn clean package` for the backend.

## Current Product Direction

AgroLink Hub is designed for a Sri Lankan/local agriculture and small business context:

- Farmers can promote harvests, updates, education posts, and products.
- Small sellers can build trust through social content, reviews, and order fulfillment.
- Buyers can discover real business pages instead of only isolated product cards.
- Social features keep users active while commerce features create practical value.
- Admin and support workflows keep the platform safer as the community grows.
