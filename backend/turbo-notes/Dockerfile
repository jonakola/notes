# Use an official Python runtime as a parent image
FROM python:3.13-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=notes.settings

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy project
COPY . /app/

# Create a non-root user to run the app
RUN useradd -m django_user
RUN chown -R django_user:django_user /app
USER django_user

# Collect static files
RUN python manage.py collectstatic --noinput

# Run gunicorn
EXPOSE 7777
CMD ["gunicorn", "--bind", "0.0.0.0:7777", "notes.wsgi:application"]