## 📝 Notes Frontend

**Notes Frontend** is a modern note-taking application built with **Next.js 15** and **React 19**. This application provides a **clean** and **intuitive** interface for users to create, organize, and manage their notes with **category support**.

### 🚀 Features
- 🔐 **User Authentication**: Login and registration functionality
- 📝 **Create & Edit Notes**: Easily add and modify notes
- 🗂️ **Organize by Categories**: Structure notes by custom categories
- 🎨 **Color-Coded Notes**: Category-based color styling
- 📱 **Responsive Design**: Works on mobile and desktop
- 🔄 **Real-Time Updates**: Notes sync instantly

## 🏗️ Technology Stack
- **🖥️ Framework**: Next.js 15 with App Router
- **⚛️ Runtime**: React 19
- **🎨 Styling**: Tailwind CSS v4
- **🧪 Testing**: Jest and Playwright
- **🐳 Containerization**: Docker
- **🔌 API Communication**: Server-side API routes

## ⚙️ Getting Started

### 🔧 Prerequisites
- **Node.js 18+**
- **npm** or **yarn**

### 📥 Installation

Clone the repository:

```sh
git clone https://github.com/yourusername/notes-frontend.git
cd notes-frontend
```

Install dependencies:

```sh
npm install
```

Create a `.env.local` file in the root directory with the following variables:

```sh
NEXT_PUBLIC_API_BASE_URL=http://your-backend-api-url
```

Start the development server:

```sh
npm run dev
```

The application will be available at **[http://localhost:9000](http://localhost:9000)**.

## 🌍 Environment Setup

The application requires the following environment variable:

```sh
NEXT_PUBLIC_API_BASE_URL: The base URL of the backend API server
```

## 🐳 Docker Deployment

### 📦 Building the Docker Image

```sh
docker build -t notes-frontend .
```

### 🚀 Running the Docker Container

```sh
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=http://your-backend-api-url notes-frontend
```

The application will be available at **[http://localhost:3000](http://localhost:3000)**.

## 🧪 Testing

### ✅ Unit & Integration Tests (Jest)

Run the Jest tests:

```sh
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

### 🏁 End-to-End Tests (Playwright)

Run the Playwright tests:

```sh
# Run e2e tests
npm run e2e
```

## 🏗️ Key Components
- **🔑 AuthProvider**: Manages authentication state across the application
- **📋 CategoryList**: Displays and manages note categories
- **📝 NoteList**: Displays a grid of note cards
- **🎨 CustomCategorySelect**: A custom dropdown for selecting categories
- **🚫 EmptyState**: Display when no notes are available

## 🔌 API Routes
The application includes server-side API route handlers that proxy requests to the backend:

- **📁 /api/categories**: Get all categories
- **📝 /api/notes**: CRUD operations for notes
- **👤 /api/register**: User registration
- **🔑 /api/token**: User authentication

## 🛠️ Development Notes
- The application uses **Next.js App Router** (`app` directory)
- **Server components** and **Client components** are used according to Next.js best practices
- **API routes** in `/app/api` handle server-side API calls
- **TypeScript** is used throughout the application for type safety
- The application leverages **Turbopack** for fast development builds

## ⚡ Performance Optimizations
- 🚀 **Server-side rendering** for initial page load
- ⚡ **Client-side navigation** for subsequent page transitions
- 🖼️ **Image optimization** with Next.js Image component
- 🔄 **Optimistic UI updates** for a responsive feel

## 📜 License
This project is licensed under the **MIT License** - see the `LICENSE` file for details.

🎉 **Happy note-taking!** 📝

