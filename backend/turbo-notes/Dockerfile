FROM python:3.13-slim-bookworm AS python-base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=notes.settings
ENV STATIC_ROOT=/app/staticfiles

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev nginx supervisor ca-certificates\
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Properly set up PostgreSQL SSL certificates with correct permissions
RUN mkdir -p /root/.postgresql && chmod 700 /root/.postgresql \
    && cp /etc/ssl/certs/ca-certificates.crt /root/.postgresql/root.crt \
    && chmod 600 /root/.postgresql/root.crt

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy project
COPY . /app/

# Create directories for static files
RUN mkdir -p /app/staticfiles

# Collect static files
RUN python manage.py collectstatic --noinput

# Configure Nginx
COPY nginx.conf /etc/nginx/sites-available/default
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

# Setup supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port for Nginx
EXPOSE 7777

# Start supervisord as the main process
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]