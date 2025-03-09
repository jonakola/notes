import json
from django.urls import reverse
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status


class AuthenticationAPITests(TestCase):
    """Test the authentication endpoints"""

    def setUp(self):
        self.client = APIClient()
        
        # Create a test user
        self.test_user_email = 'testuser@example.com'
        self.test_user_password = 'TestPassword123!'
        self.test_user = User.objects.create_user(
            username=self.test_user_email,
            email=self.test_user_email,
            password=self.test_user_password
        )
        
        # Endpoint URLs
        self.register_url = reverse('register')
        self.token_url = reverse('token_obtain_pair')
        self.token_refresh_url = reverse('token_refresh')

    def test_user_registration_success(self):
        """Test successful user registration"""
        new_user_data = {
            'email': 'newuser@example.com',
            'password': 'NewUserPassword123!'
        }
        
        response = self.client.post(
            self.register_url,
            data=json.dumps(new_user_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], new_user_data['email'])
        self.assertIn('message', response.data)
        
        # Verify user was created in the database
        user_exists = User.objects.filter(email=new_user_data['email']).exists()
        self.assertTrue(user_exists)

    def test_user_registration_duplicate_email(self):
        """Test registration fails with duplicate email"""
        duplicate_user_data = {
            'email': self.test_user_email,  # Already exists
            'password': 'AnotherPassword123!'
        }
        
        response = self.client.post(
            self.register_url,
            data=json.dumps(duplicate_user_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)  # Should contain email validation error
        
        # Verify no new user was created
        user_count = User.objects.filter(email=self.test_user_email).count()
        self.assertEqual(user_count, 1)  # Still just one user with this email

    def test_user_registration_weak_password(self):
        """Test registration fails with a weak password"""
        weak_password_data = {
            'email': 'weakpassword@example.com',
            'password': '12345'  # Too simple
        }
        
        response = self.client.post(
            self.register_url,
            data=json.dumps(weak_password_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)  # Should contain password validation error
        
        # Verify no user was created
        user_exists = User.objects.filter(email=weak_password_data['email']).exists()
        self.assertFalse(user_exists)

    def test_user_login_success(self):
        """Test successful user login returns valid tokens"""
        login_data = {
            'email': self.test_user_email,
            'password': self.test_user_password
        }
        
        response = self.client.post(
            self.token_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        # Verify tokens are non-empty strings
        self.assertTrue(isinstance(response.data['access'], str))
        self.assertTrue(isinstance(response.data['refresh'], str))
        self.assertTrue(len(response.data['access']) > 0)
        self.assertTrue(len(response.data['refresh']) > 0)

    def test_user_login_wrong_email(self):
        """Test login fails with non-existent email"""
        login_data = {
            'email': 'nonexistent@example.com',
            'password': self.test_user_password
        }
        
        response = self.client.post(
            self.token_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)  # Should have email-related error

    def test_user_login_wrong_password(self):
        """Test login fails with wrong password"""
        login_data = {
            'email': self.test_user_email,
            'password': 'WrongPassword123!'
        }
        
        response = self.client.post(
            self.token_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # Should contain some kind of detail or non-field error
        self.assertTrue('detail' in response.data or 'non_field_errors' in response.data)

    def test_token_refresh(self):
        """Test refreshing an access token with a valid refresh token"""
        # First get a valid refresh token by logging in
        login_data = {
            'email': self.test_user_email,
            'password': self.test_user_password
        }
        
        login_response = self.client.post(
            self.token_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        refresh_token = login_response.data['refresh']
        
        # Now try to refresh the token
        refresh_data = {
            'refresh': refresh_token
        }
        
        refresh_response = self.client.post(
            self.token_refresh_url,
            data=json.dumps(refresh_data),
            content_type='application/json'
        )
        
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)
        
        # Verify the new access token is a non-empty string
        self.assertTrue(isinstance(refresh_response.data['access'], str))
        self.assertTrue(len(refresh_response.data['access']) > 0)
        
        # Verify it's different from the original access token
        self.assertNotEqual(refresh_response.data['access'], login_response.data['access'])

    def test_token_refresh_invalid_token(self):
        """Test token refresh fails with an invalid refresh token"""
        refresh_data = {
            'refresh': 'invalid.refresh.token'
        }
        
        response = self.client.post(
            self.token_refresh_url,
            data=json.dumps(refresh_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)  # Should have error detail
        self.assertIn('token', response.data['detail'].lower())  # Error should mention token

    def test_authorized_access_with_token(self):
        """Test accessing a protected endpoint with a valid token"""
        # First get a valid token
        login_data = {
            'email': self.test_user_email,
            'password': self.test_user_password
        }
        
        login_response = self.client.post(
            self.token_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        access_token = login_response.data['access']
        
        # Use the token to access a protected endpoint (notes list for example)
        notes_url = reverse('note-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(notes_url)
     
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthorized_access_without_token(self):
        """Test accessing a protected endpoint without a token"""
        # Clear any credentials
        self.client.credentials()
        
        # Try to access a protected endpoint without token
        notes_url = reverse('note-list')
        response = self.client.get(notes_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        