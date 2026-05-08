# Bondly - Spring Boot React Social Media App

Bondly is a full-stack social media web application built with **Spring Boot** and **React**.  
It is designed as a modern social platform with secure authentication, email verification, real-time communication, user profiles, posts, notifications, and chat features.

## Repository Name

springboot-react-bondly-social-media-app

## Repository Description

A full-stack social media web application built with Spring Boot and React, featuring JWT HTTP-only cookie authentication, SMTP email OTP verification, real-time WebSocket chat, notifications, posts, profiles, and scalable social media features.

---

## Project Overview

Bondly is a professional social media platform inspired by modern applications like Facebook, Instagram, and Discord.

The project uses a **Spring Boot backend** for APIs, security, database handling, authentication, WebSocket communication, and business logic.  
The **React frontend** provides a responsive and user-friendly interface for posts, profiles, messages, and notifications.

---

## Main Features

### Authentication and Security

- User registration
- Email OTP verification using SMTP
- Login with email and password
- JWT authentication
- HTTP-only cookie based token storage
- Refresh token support
- Secure logout
- Protected backend APIs
- Role-based access control
- Forgot password with OTP verification
- BCrypt password encryption

### User Profile Management

- View user profile
- Update first name and last name
- Update profile photo
- Update cover photo
- Update bio and user details
- Change password securely
- Delete account safely
- Account privacy support

### Social Media Features

- Create posts
- View home feed
- Like posts
- Comment on posts
- Share posts
- Upload images and videos
- Save/bookmark posts
- User activity display
- Profile-based post listing

### Real-Time Chat

- One-to-one private chat
- Group chat support
- WebSocket based real-time messaging
- Online/offline status
- Typing indicator
- Message delivered/seen status
- Media upload in chat
- Secure sender and receiver message access

### Real-Time Notifications

- WebSocket notification updates
- New like notifications
- New comment notifications
- New follower notifications
- Friend request notifications
- Message notifications
- Unread notification count
- Mark notifications as read

---

## Tech Stack

### Backend

- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- JWT
- HTTP-only Cookies
- WebSocket
- SMTP Email Service
- MySQL or PostgreSQL
- Maven
- Lombok

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS or CSS Modules
- React Toastify
- WebSocket client
- Responsive UI components

---

## Suggested Project Structure

```text
springboot-react-bondly-social-media-app/
│
├── backend/
│   ├── src/main/java/
│   │   └── com/bondly/
│   │       ├── config/
│   │       ├── controller/
│   │       ├── dto/
│   │       ├── entity/
│   │       ├── exception/
│   │       ├── mapper/
│   │       ├── repository/
│   │       ├── security/
│   │       ├── service/
│   │       ├── serviceImpl/
│   │       └── util/
│   │
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   │
│   └── package.json
│
└── README.md
