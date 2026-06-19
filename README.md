# AgroLink Hub

AgroLink Hub is a full-stack social commerce platform for local communities, farmers, producers, small businesses, buyers, and admins. It brings the energy of a social network into a practical marketplace, so people can share updates, build trust, sell products, manage orders, and get support in one place.

The core idea is simple: a seller should not need one platform for audience, another for chat, another for product listing, and another for orders. AgroLink Hub keeps those workflows together. A farmer can post harvest updates, answer customer questions, list fresh products, receive orders, and build a trusted business profile. A small shop can do the same with handmade products, food items, supplies, or local services. Buyers can discover real sellers, compare products, place orders, and communicate directly.

![AgroLink Hub marketplace preview](Lisharefrontend/src/assets/backgrounds/agrolink-landing-hero-marketplace-4k.jpg)

## Why It Matters

Many small producers and small businesses depend on social media to reach customers, but normal social platforms do not give them proper product, cart, order, review, and seller-management workflows. Marketplace-only platforms can solve selling, but they often miss community trust and daily engagement.

AgroLink Hub connects both sides:

- Community posts, comments, reactions, stories, reels, followers, friends, and chat keep people active.
- Business pages, marketplace products, carts, orders, reviews, and analytics turn that activity into real buying and selling.
- Direct producer-to-customer selling reduces dependency on middlemen. Customers can get better prices, and sellers can keep a fairer share of the value.
- The platform is useful for farmers, but it is not limited to farmers. Any small business can use the same flow to promote products, build a customer base, and manage orders.

## Product Snapshot

| Social | Commerce | Workspace |
| --- | --- | --- |
| ![Social feature](Lisharefrontend/src/assets/backgrounds/landing-feature-community.jpg) | ![Commerce feature](Lisharefrontend/src/assets/backgrounds/landing-feature-marketplace.jpg) | ![Workspace feature](Lisharefrontend/src/assets/backgrounds/landing-feature-workspace.jpg) |
| Posts, stories, comments, reactions, followers, friends, and chat. | Product discovery, cart, checkout, seller orders, business profiles, and reviews. | Calendar, analytics, notifications, support tickets, admin tools, and role-based dashboards. |

## Who Uses It

| User type | What they get |
| --- | --- |
| Farmers and producers | A place to promote harvests, publish products, talk to buyers, receive orders, and earn closer to the real product value. |
| Small businesses | A lightweight online storefront connected to social reach, customer trust, reviews, and order management. |
| Buyers | Direct access to local sellers, product details, saved cart items, order tracking, seller reviews, and chat. |
| Community users | A familiar social feed with posts, media, reactions, comments, stories, reels, friends, follows, and notifications. |
| Creators | A social-first account experience with discovery and community engagement. |
| Admins | User management, role workflows, support tickets, reports, moderation, and platform oversight. |

## Main Features

### Social Community

- Create posts with media, captions, audience metadata, feelings, location data, and poll support.
- Post categories show XP guidance in the composer. Education and News posts earn the strongest XP weight because the product intentionally rewards useful knowledge, local updates, and learning content.
- React, comment, reply, share, save posts, and report unsafe content.
- Stories and reel-style content for short updates.
- Profiles with cover photos, profile media, bio, activity, posts, saved content, and public profile views.
- Friends, followers, following, discovery, requests, accepts, rejects, cancels, and unfriending.
- Real-time notifications with unread count, mark-read, delete, and clear-all actions.

### Messaging

- Direct chat is available from the chat UI through account search and conversation opening.
- Group chats can be created from the Messages page by adding a group name and selecting at least two members.
- WebSocket/STOMP is used for incoming chat messages, typing events, and presence updates.
- Online/offline presence, typing indicator, message sent/delivered/read ticks, message seen state, and message reactions are implemented.
- Image/video attachments can be uploaded and rendered in messages.
- The chat detail panel shows recent shared media from attachment messages.
- Pinned link persistence is outside the final project scope; completed chat behavior focuses on reliable messaging, media, reactions, presence, and read receipts.

### Marketplace

- Product listing with images, category, price, stock, availability, delivery method, and seller details.
- Marketplace browsing with filtering, search, sorting, featured products, seller pages, and product detail views.
- Business profiles with owner details, product lists, reviews, and ratings.
- Cart persistence on the backend, so buyer cart data is not only temporary browser state.
- Checkout flow from cart into real order records.

### Seller Workspace

- Business and farmer accounts can manage a public seller page.
- Sellers can add, edit, and remove products.
- Seller order view for received orders.
- Order status workflow for pending, accepted, processing, on the way, completed, and cancelled orders.
- Analytics screens for seller and admin insight.

### Platform Tools

- Signup, login, OTP verification, forgot password, refresh token flow, logout, and Google OAuth2 support.
- Role-based routing for user, creator, business, farmer, and admin accounts.
- Calendar with events, meetings, birthdays, tasks, reminders, and planning views.
- Support center with tickets, admin replies, website reviews, and moderation messages.
- Admin command center for users, roles, reports, support tickets, and safety workflows.
- Landing-page assistant backed by a small knowledge base.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 6, React Router, Axios, STOMP client |
| Backend | Java 25, Spring Boot 4.0.2, Spring Security, Spring Data JPA, WebSocket/STOMP, Spring Mail |
| Database | PostgreSQL |
| Auth | JWT access/refresh/verify cookies, email OTP, Google OAuth2 |
| UI | Modular React pages, shared dashboard components, custom CSS design system |
| Media | Local upload handling through Spring resource mapping |

## Repository Layout

```text
springboot-react-bondly-social-media-app/
  Lisharebackend/
    src/main/java/com/socialApp/Lishare/
      modules/
        business/      # products, cart, orders, business pages, reviews, support, admin
        platform/      # auth, users, calendar, security, storage, common utilities
        social/        # posts, stories, comments, reactions, chat, friends, follow, notifications
    src/main/resources/
      application.yaml
      schema.sql
    .env.example
    pom.xml

  Lisharefrontend/
    src/
      assets/          # branding, landing images, generated feature visuals, workspace backgrounds
      modules/
        business/      # marketplace, cart, orders, analytics, business pages, admin
        platform/      # app routes, auth, profile, settings, support, calendar, shared UI
        social/        # feed, chat, friends, notifications, posts
      dashboard-ui.css
      feed-card-reference.css
    .env.example
    package.json

  docs/
    agrolink-hub-project-report.html
    agrolink-hub-project-report.pdf
```

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page with product story, platform areas, reviews, and assistant |
| `/login`, `/signup`, `/verify`, `/forgot-password` | Authentication and account recovery |
| `/home` | Social feed, posts, stories, reels, reactions, and comments |
| `/profile`, `/profile/:userId` | User profile and profile content |
| `/friends` | Friend and follow discovery |
| `/chat` | Real-time messaging |
| `/marketplace` | Product discovery and seller profiles |
| `/cart` | Buyer cart and checkout |
| `/orders` | Buyer order history and seller received orders |
| `/business` | Business/farmer seller studio |
| `/analytics` | Seller/admin analytics |
| `/calendar` | Events, tasks, meetings, birthdays, and reminders |
| `/support` | User support tickets and website reviews |
| `/admin` | Admin command center |

## Roles

| Role | Access |
| --- | --- |
| `ROLE_USER` | Feed, marketplace buying, cart, orders, chat, support, calendar, profile |
| `ROLE_CREATOR` | Social content, creator account experience, marketplace buying, chat, support |
| `ROLE_BUSINESS` | Business page, product listing, seller orders, analytics |
| `ROLE_FARMER` | Farmer seller tools, product listing, seller orders, analytics |
| `ROLE_ADMIN` | Admin dashboard, users, moderation, support tickets, reports, role workflows |

Admin accounts should be created through a controlled admin/database process. Public signup is for normal platform roles.

## Environment Configuration

Secrets must stay outside git. Use the included `.env.example` files as templates.

Backend environment values:

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

Frontend environment values:

```text
VITE_API_BASE_URL=http://localhost:8081
VITE_WS_URL=ws://localhost:8081/ws
```

Security note: if a real password, app password, token, or JWT secret was ever committed before cleanup, rotate it. Removing a value from the current file does not remove it from old git history.

## Running Locally

### 1. Create PostgreSQL Database

```sql
CREATE DATABASE bodlyy_db;
```

### 2. Start Backend

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

If Vite chooses another port, use the URL printed in the terminal.

## Build and Verification

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

Some backend tests may need PostgreSQL and environment variables, depending on the active test profile.

## Design and UI Notes

The frontend uses shared UI components from:

```text
Lisharefrontend/src/modules/platform/common/ui/DashboardUI.jsx
```

Main design files:

```text
Lisharefrontend/src/index.css
Lisharefrontend/src/dashboard-ui.css
Lisharefrontend/src/feed-card-reference.css
```

The current UI direction is practical and work-focused: strong AgroLink green/teal/yellow branding, fewer plain white cards, stable cart and order layouts, compact notifications, responsive marketplace cards, refined auth pages, and dedicated landing visuals for the Social, Commerce, and Workspace feature cards.

## Documentation

Full project report:

- [HTML report](docs/agrolink-hub-project-report.html)
- [PDF report](docs/agrolink-hub-project-report.pdf)

The report covers product purpose, target users, system architecture, technology stack, frontend/backend modules, database behavior, authentication, social features, business workflows, support tools, testing notes, deployment checklist, and final handover notes.

## Data and Upload Hygiene

Runtime uploads are application data, not source code. They are ignored by git:

```text
uploads/
**/uploads/
```

Local uploaded files can remain on a developer machine, but they should not be committed. IDE files, logs, build folders, local environment files, private Spring profiles, frontend `dist`, backend `target`, and dependency folders are also ignored.

## Production Checklist

- Set production PostgreSQL credentials through the hosting secret store.
- Use a strong Base64 JWT secret.
- Configure mail credentials for OTP and password reset emails.
- Configure OAuth2 redirect URLs for the production domain.
- Set `COOKIE_SECURE=true` behind HTTPS.
- Restrict CORS origins to trusted frontend domains.
- Use persistent upload storage outside the git repository.
- Run frontend and backend builds before release.
- Add route-level code splitting if the frontend bundle size becomes a deployment concern.

## Project Direction

AgroLink Hub is built for a local agriculture and small-business setting, but the model can support any community where trust and commerce belong together. The strongest value is the connection between social activity and direct selling: people can follow sellers, see updates, ask questions, read reviews, place orders, and keep returning to the same platform.

That makes the platform useful for farmers, home-based sellers, small shops, local producers, creators, buyers, and admins who need a managed digital marketplace with real community behavior behind it.

The XP idea supports that vision. General entertainment can keep a community active, but a healthy community also needs people to share useful news, practical education, farming knowledge, product updates, safety notices, and local opportunities. Giving higher XP to Education and News categories gently nudges users toward posts that help others think, learn, and make better decisions. Over time, that makes the feed more than a place to scroll: it becomes a local knowledge space where good information has visible value.

Messaging supports the same trust model. Sent, delivered, and read ticks make conversations clearer, so buyers and sellers know whether a message reached the other person and whether it was seen. That small detail matters when someone is asking about stock, delivery, price, or an order.
