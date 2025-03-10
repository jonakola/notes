## Notes API

📝 **Notes API** is a **Django-based RESTful API** for managing personal notes and categories. The application provides a **secure** way to create, read, update, and delete notes, organized by user-defined categories. Each user can only access their own notes and categories, with **JWT authentication** ensuring proper security.

### 🚀 Features
- 🔐 **User Authentication**: Email-based registration and JWT token authentication
- 🗂️ **Categories Management**: Create and manage categories with custom colors
- 📝 **Notes Organization**: Create, edit, and organize notes by category
- 🌍 **RESTful API**: Full CRUD operations for notes and categories
- 🔒 **User Isolation**: Each user can only access their own data
- ✅ **Data Validation**: Input validation for all endpoints
- 📊 **Pagination**: Proper pagination for list endpoints

## 🏗️ Technical Stack
- **Django 5.1.7**: Core web framework
- **Django REST Framework 3.15.2**: RESTful API framework
- **Simple JWT 5.5.0**: JWT authentication
- **PostgreSQL**: Database backend
- **Docker**: Containerization

## 🔌 API Endpoints

### 🔑 Authentication
- **POST** `/api/register/` - Register a new user with email and password
- **POST** `/api/token/` - Obtain JWT token pair with email and password
- **POST** `/api/token/refresh/` - Refresh access token using refresh token

### 📁 Categories
- **GET** `/api/categories/` - List all categories (with note counts)
- **POST** `/api/categories/` - Create a new category
- **GET** `/api/categories/{id}/` - Get category details
- **PUT** `/api/categories/{id}/` - Update category
- **PATCH** `/api/categories/{id}/` - Partially update category
- **DELETE** `/api/categories/{id}/` - Delete category

### 📝 Notes
- **GET** `/api/notes/` - List all notes
- **GET** `/api/notes/?category={id}` - List notes filtered by category
- **POST** `/api/notes/` - Create a new note
- **GET** `/api/notes/{id}/` - Get note details
- **PUT** `/api/notes/{id}/` - Update note
- **PATCH** `/api/notes/{id}/` - Partially update note
- **DELETE** `/api/notes/{id}/` - Delete note

## ⚙️ Setup and Installation

### 🔧 Environment Variables
Create a `.env` file with the following variables:

```sh
# Database Configuration
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
DB_PORT=5432

# Security Settings
SECRET_KEY=your_django_secret_key

# Allowed Hosts & CORS
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com,http://localhost:3000
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://localhost:3000

# Static Files
STATIC_ROOT=/path/to/static/files
```

### 💻 Local Development

Create a virtual environment:

```sh
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:

```sh
pip install -r requirements.txt
```

Run migrations:

```sh
python manage.py migrate
```

Start the development server:

```sh
python manage.py runserver
```

## 🐳 Docker Deployment

### 📦 Build the Docker Image

```sh
docker build -t notes-api .
```

### 🚀 Run the Docker Container

```sh
docker run -d -p 7777:7777 \
  --env-file .env \
  --name notes-api \
  notes-api
```

### 🛠️ Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  notes-api:
    build: .
    ports:
      - "7777:7777"
    env_file:
      - .env
    restart: always
    depends_on:
      - db
  
  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    env_file:
      - .env
    restart: always

volumes:
  postgres_data:
```

Then run:

```sh
docker-compose up -d
```

## 🧪 Testing

Run the test suite with:

```sh
python manage.py test
```

Or with coverage:

```sh
coverage run --source='.' manage.py test
coverage report
```

## 🔐 Security Considerations
- ✅ The application uses **JWT** for authentication
- 🔒 **User data is isolated** by design
- 🔑 **Password validation** ensures strong passwords
- 🛡️ **CSRF protection** is enabled
- ✅ Proper **validation for all inputs**

## 📜 License
This project is licensed under the **MIT License** - see the `LICENSE` file for details.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a **Pull Request**. 🚀

