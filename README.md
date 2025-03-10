## 📝 Notes Application

The **Notes Application** consists of a **Django-based RESTful API** for managing personal notes and categories and a **Next.js 15** frontend for an intuitive note-taking experience. This system ensures **secure authentication**, **user-specific data isolation**, and **real-time updates** for a seamless user experience.

## 🚀 Features
- 🔐 **User Authentication**: JWT-based authentication and email-based registration
- 📝 **Notes Management**: Create, edit, and delete personal notes
- 🗂️ **Categories Organization**: Assign notes to user-defined categories
- 🎨 **Color-Coded Notes**: Organize with category-based colors
- 🔄 **Real-Time Updates**: Instant sync of notes and categories
- 📱 **Responsive Design**: Optimized for both desktop and mobile
- 🌍 **RESTful API**: Full CRUD operations for notes and categories

## 🏗️ Technology Stack
### **Frontend**
- **🖥️ Framework**: Next.js 15 with App Router
- **⚛️ Runtime**: React 19
- **🎨 Styling**: Tailwind CSS v4
- **🧪 Testing**: Jest and Playwright
- **🐳 Containerization**: Docker
- **🔌 API Communication**: Server-side API routes

### **Backend**
- **🐍 Framework**: Django 5.1.7
- **🔧 API**: Django REST Framework 3.15.2
- **🔑 Authentication**: Simple JWT 5.5.0
- **🗄️ Database**: PostgreSQL
- **🐳 Deployment**: Docker & Docker Compose

## 🔌 API Endpoints
### 🔑 Authentication
- **POST** `/api/register/` - Register a new user
- **POST** `/api/token/` - Obtain JWT token pair
- **POST** `/api/token/refresh/` - Refresh access token

### 📁 Categories
- **GET** `/api/categories/` - List all categories
- **POST** `/api/categories/` - Create a category
- **GET** `/api/categories/{id}/` - Get category details
- **PUT** `/api/categories/{id}/` - Update category
- **DELETE** `/api/categories/{id}/` - Delete category

### 📝 Notes
- **GET** `/api/notes/` - List all notes
- **GET** `/api/notes/?category={id}` - Filter notes by category
- **POST** `/api/notes/` - Create a new note
- **GET** `/api/notes/{id}/` - Get note details
- **PUT** `/api/notes/{id}/` - Update note
- **DELETE** `/api/notes/{id}/` - Delete note

## ⚙️ Setup and Installation

### 🔧 Prerequisites
- **Node.js 18+**
- **Python 3.9+**
- **PostgreSQL**
- **Docker (optional for containerized deployment)**

### 📥 Installation (Frontend)
```sh
git clone https://github.com/yourusername/notes-frontend.git
cd notes-frontend
npm install
npm run dev
```
Frontend available at **[http://localhost:9000](http://localhost:9000)**.

### 🛠️ Installation (Backend)
```sh
git clone https://github.com/yourusername/notes-api.git
cd notes-api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Backend available at **[http://localhost:7777](http://localhost:7777)**.

## 🐳 Docker Deployment
### 📦 Build and Run the Frontend
```sh
docker build -t notes-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=http://your-backend-api-url notes-frontend
```
### 📦 Build and Run the Backend
```sh
docker build -t notes-api .
docker run -d -p 7777:7777 --env-file .env --name notes-api notes-api
```
### 🛠️ Using Docker Compose
```sh
docker-compose up -d
```

## 🧪 Testing
### ✅ Frontend
```sh
npm test
npm run e2e
```
### ✅ Backend
```sh
python manage.py test
```

## 🔐 Security Considerations
- **JWT authentication** for secure user access
- **User data isolation** by design
- **Strong password validation** and CSRF protection
- **Input validation** to prevent malicious requests

## 📜 License
This project is licensed under the **MIT License** - see the `LICENSE` file for details.

🎉 **Happy note-taking!** 📝

