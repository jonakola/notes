from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from coreapp.models import Category
from coreapp.serializers import CategorySerializer
from rest_framework_simplejwt.tokens import RefreshToken


class CategoryAPITests(TestCase):
    """Test the Category API with authentication"""

    def setUp(self):
        self.client = APIClient()
        
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='testpass123',
            first_name='Anonymous',
            last_name='User'
        )
        
        # Create a second user to test isolation between users
        self.other_user = User.objects.create_user(
            username='otheruser@example.com',
            email='otheruser@example.com',
            password='testpass456',
            first_name='Anonymous',
            last_name='User'
        )
        
        # Create sample categories for testing
        self.category1 = Category.objects.create(name="Work", colour="#FF5733", user=self.user)
        self.category2 = Category.objects.create(name="Personal", colour="#33FF57", user=self.user)
        self.category3 = Category.objects.create(name="Health", colour="#3357FF", user=self.user)
        
        # Create a category for the other user to test isolation
        self.other_user_category = Category.objects.create(
            name="Other User Category", 
            colour="#CCCCCC", 
            user=self.other_user
        )
        
        # Get authentication tokens
        self.refresh = RefreshToken.for_user(self.user)
        self.token = str(self.refresh.access_token)
        
        # Authenticate the client
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_get_all_categories(self):
        """Test retrieving a list of categories (only user's categories)"""
        url = reverse('category-list')
        response = self.client.get(url)

        # Only categories for the current user should be returned
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that the response is paginated and contains results
        self.assertIn('results', response.data)
        
        # Check the correct number of categories is returned
        self.assertEqual(len(response.data['results']), 3)
        
        # Verify all returned categories belong to the current user
        category_ids = [item['id'] for item in response.data['results']]
        user_category_ids = list(Category.objects.filter(user=self.user).values_list('id', flat=True))
        self.assertCountEqual(category_ids, user_category_ids)
        
        # Verify each category has a notes_count field
        for item in response.data['results']:
            self.assertIn('notes_count', item)
        
        # Ensure other user's categories are not included
        for item in response.data['results']:
            self.assertNotEqual(item['name'], self.other_user_category.name)

    def test_get_category_detail(self):
        """Test retrieving a single category with notes count"""
        # Create some notes for this category
        from coreapp.models import Note
        from datetime import date
        
        # Add 3 notes to category1
        Note.objects.create(
            title="Test Note 1",
            content="Content for test note 1",
            date=date.today(),
            category=self.category1,
            user=self.user
        )
        Note.objects.create(
            title="Test Note 2",
            content="Content for test note 2",
            date=date.today(),
            category=self.category1,
            user=self.user
        )
        Note.objects.create(
            title="Test Note 3",
            content="Content for test note 3",
            date=date.today(),
            category=self.category1,
            user=self.user
        )
        
        url = reverse('category-detail', args=[self.category1.id])
        response = self.client.get(url)

        # The serializer in the view now includes notes_count via annotation
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify notes_count field exists and has correct value
        self.assertIn('notes_count', response.data)
        self.assertEqual(response.data['notes_count'], 3)
        
        # Verify the other fields are still correct
        self.assertEqual(response.data['id'], self.category1.id)
        self.assertEqual(response.data['name'], self.category1.name)
        self.assertEqual(response.data['colour'], self.category1.colour)
        
    def test_cannot_get_other_users_category(self):
        """Test that a user cannot access another user's category"""
        url = reverse('category-detail', args=[self.other_user_category.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_category(self):
        """Test creating a new category"""
        url = reverse('category-list')
        payload = {
            'name': 'Education',
            'colour': '#9933FF'
        }
        response = self.client.post(url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify category was created in the database with current user
        category = Category.objects.get(name=payload['name'])
        self.assertEqual(category.colour, payload['colour'])
        self.assertEqual(category.user, self.user)

    def test_update_category(self):
        """Test updating a category"""
        url = reverse('category-detail', args=[self.category1.id])
        payload = {
            'name': 'Updated Category',
            'colour': '#999999'
        }
        response = self.client.put(url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh the database object
        self.category1.refresh_from_db()
        self.assertEqual(self.category1.name, payload['name'])
        self.assertEqual(self.category1.colour, payload['colour'])
        # Ensure user remains the same
        self.assertEqual(self.category1.user, self.user)

    def test_partial_update_category(self):
        """Test partially updating a category"""
        original_colour = self.category1.colour
        url = reverse('category-detail', args=[self.category1.id])
        payload = {'name': 'Partially Updated'}
        
        response = self.client.patch(url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh the database object
        self.category1.refresh_from_db()
        self.assertEqual(self.category1.name, payload['name'])
        # Ensure colour was not changed
        self.assertEqual(self.category1.colour, original_colour)

    def test_delete_category(self):
        """Test deleting a category"""
        url = reverse('category-detail', args=[self.category1.id])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify category was deleted from the database
        exists = Category.objects.filter(id=self.category1.id).exists()
        self.assertFalse(exists)
        
    def test_cannot_delete_other_users_category(self):
        """Test that a user cannot delete another user's category"""
        url = reverse('category-detail', args=[self.other_user_category.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verify the other user's category still exists
        exists = Category.objects.filter(id=self.other_user_category.id).exists()
        self.assertTrue(exists)

    def test_create_category_invalid_colour(self):
        """Test creating a category with invalid colour fails"""
        url = reverse('category-list')
        payload = {
            'name': 'Invalid Colour',
            'colour': 'not-a-hex-colour'
        }
        response = self.client.post(url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Ensure category wasn't created
        exists = Category.objects.filter(name=payload['name']).exists()
        self.assertFalse(exists)
        
    def test_unauthenticated_access(self):
        """Test that unauthenticated requests are rejected"""
        # Remove authentication
        self.client.credentials()
        
        # Test list endpoint
        url = reverse('category-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test detail endpoint
        url = reverse('category-detail', args=[self.category1.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test create endpoint
        url = reverse('category-list')
        payload = {'name': 'New Category', 'colour': '#AABBCC'}
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)