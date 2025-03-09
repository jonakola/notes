import json
from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from coreapp.models import Note, Category


class NoteAPITest(TestCase):
    def setUp(self):
        Note.objects.all().delete()
        Category.objects.all().delete()
        """Set up test data and client"""
        self.client = APIClient()
        
        # Create test users
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='testpass123',
            first_name='Anonymous',
            last_name='User'
        )
        
        self.other_user = User.objects.create_user(
            username='otheruser@example.com',
            email='otheruser@example.com',
            password='testpass456',
            first_name='Anonymous',
            last_name='User'
        )
        
        # Get authentication tokens
        self.refresh = RefreshToken.for_user(self.user)
        self.token = str(self.refresh.access_token)
        
        # Authenticate the client
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        # Create test categories
        self.category1 = Category.objects.create(
            name="Work", 
            colour="#FF5733",
            user=self.user
        )
        self.category2 = Category.objects.create(
            name="Personal", 
            colour="#33FF57",
            user=self.user
        )
        
        # Create a category for the other user
        self.other_user_category = Category.objects.create(
            name="Other User Category", 
            colour="#CCCCCC",
            user=self.other_user
        )
        
        # Create test notes
        self.note1 = Note.objects.create(
            title="First Note",
            content="This is the first test note content.",
            date=date(2023, 1, 15),
            category=self.category1,
            user=self.user
        )
        
        self.note2 = Note.objects.create(
            title="Second Note",
            content="This is the second test note content.",
            date=date(2023, 2, 20),
            category=self.category2,
            user=self.user
        )
        
        # Create a note for the other user
        self.other_user_note = Note.objects.create(
            title="Other User's Note",
            content="This note belongs to the other user.",
            date=date(2023, 3, 10),
            category=self.other_user_category,
            user=self.other_user
        )
        
        # URLs
        self.list_url = reverse('note-list')
        self.note1_detail_url = reverse('note-detail', kwargs={'pk': self.note1.pk})
        self.other_user_note_url = reverse('note-detail', kwargs={'pk': self.other_user_note.pk})
        
        # Valid data for creating/updating notes
        self.valid_payload = {
            'title': 'New Test Note',
            'content': 'This is a new test note.',
            'date': '2023-03-25',
            'category_id': self.category1.id
        }
        
        self.invalid_payload = {
            'title': '',  # Empty title should be invalid
            'content': 'This is an invalid test note.',
            'date': '2023-03-25',
            'category_id': self.category1.id
        }

    def test_get_all_notes(self):
        """Test retrieving all notes (only user's notes)"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that pagination is being used
        self.assertIn('results', response.data)
        
        # Check if the expected notes are in the results and other user's note is not
        note_ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.note1.id, note_ids)
        self.assertIn(self.note2.id, note_ids)
        self.assertNotIn(self.other_user_note.id, note_ids)
        
        # Check that only the correct number of notes is returned
        self.assertEqual(len(response.data['results']), 2)  # Only the current user's notes

    def test_get_filtered_notes(self):
        """Test filtering notes by category"""
        # First verify how many notes have category1
        expected_count = Note.objects.filter(category=self.category1, user=self.user).count()
        
        # Then check the filtered API response
        url = f"{self.list_url}?category={self.category1.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Access the results from the paginated response
        self.assertIn('results', response.data, "Response missing 'results' key (pagination not enabled)")
        notes = response.data['results']
        
        # Check count matches DB query
        self.assertEqual(len(notes), expected_count)
        
        # Check that all returned notes have the correct category
        for note in notes:
            self.assertIn('category', note, "Note missing 'category' field")
            self.assertIsInstance(note['category'], dict, "Category field should be a dictionary")
            self.assertIn('id', note['category'], "Category missing 'id' field")
            self.assertEqual(note['category']['id'], self.category1.id)
        
        # If we expect exactly our test note to be in the results
        if expected_count == 1:
            # Find our test note in the results
            test_note = notes[0]
            self.assertEqual(test_note['title'], self.note1.title)
            self.assertEqual(test_note['content'], self.note1.content)
            self.assertEqual(test_note['category']['id'], self.category1.id)

    def test_get_single_note(self):
        """Test retrieving a single note"""
        response = self.client.get(self.note1_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.note1.title)
        self.assertEqual(response.data['content'], self.note1.content)
        # Check nested category data
        self.assertEqual(response.data['category']['id'], self.category1.id)
        self.assertEqual(response.data['category']['name'], self.category1.name)
        self.assertEqual(response.data['category']['colour'], self.category1.colour)

    def test_cannot_access_other_user_note(self):
        """Test that a user cannot access another user's note"""
        response = self.client.get(self.other_user_note_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_valid_note(self):
        """Test creating a new note with valid data"""
        response = self.client.post(
            self.list_url,
            data=json.dumps(self.valid_payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check total notes (should only count user's notes)
        user_notes_count = Note.objects.filter(user=self.user).count()
        self.assertEqual(user_notes_count, 3)
        
        # Check if the data was saved correctly
        self.assertEqual(response.data['title'], self.valid_payload['title'])
        self.assertEqual(response.data['content'], self.valid_payload['content'])
        self.assertEqual(response.data['date'], self.valid_payload['date'])
        self.assertEqual(response.data['category']['id'], self.valid_payload['category_id'])
        
        # Check that the note belongs to the correct user
        new_note = Note.objects.get(title=self.valid_payload['title'])
        self.assertEqual(new_note.user, self.user)

    def test_create_invalid_note(self):
        """Test creating a new note with invalid data"""
        response = self.client.post(
            self.list_url,
            data=json.dumps(self.invalid_payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        user_notes_count = Note.objects.filter(user=self.user).count()
        self.assertEqual(user_notes_count, 2)  # No new note should be created

    def test_cannot_use_other_users_category(self):
        """Test that a user cannot create a note with another user's category"""
        invalid_category_payload = {
            'title': 'Note with invalid category',
            'content': 'This note uses another users category.',
            'date': '2023-05-10',
            'category_id': self.other_user_category.id
        }
        
        response = self.client.post(
            self.list_url,
            data=json.dumps(invalid_category_payload),
            content_type='application/json'
        )
        
        # Should fail with 400 Bad Request because the serializer's queryset
        # is filtered to only include the user's categories
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_note(self):
        """Test updating an existing note"""
        update_data = {
            'title': 'Updated Title',
            'content': 'Updated content for test note',
            'date': '2023-04-01',
            'category_id': self.category2.id
        }
        
        response = self.client.put(
            self.note1_detail_url,
            data=json.dumps(update_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if the data was updated correctly
        self.note1.refresh_from_db()
        self.assertEqual(self.note1.title, update_data['title'])
        self.assertEqual(self.note1.content, update_data['content'])
        self.assertEqual(self.note1.date.isoformat(), update_data['date'])
        self.assertEqual(self.note1.category.id, update_data['category_id'])
        self.assertEqual(self.note1.user, self.user)  # User should not change

    def test_partial_update_note(self):
        """Test partially updating a note"""
        patch_data = {
            'title': 'Partially Updated Title'
        }
        
        response = self.client.patch(
            self.note1_detail_url,
            data=json.dumps(patch_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if only the title was updated
        self.note1.refresh_from_db()
        self.assertEqual(self.note1.title, patch_data['title'])
        self.assertEqual(self.note1.content, "This is the first test note content.")  # Unchanged
        self.assertEqual(self.note1.user, self.user)  # User should not change

    def test_delete_note(self):
        """Test deleting a note"""
        initial_count = Note.objects.filter(user=self.user).count()
        response = self.client.delete(self.note1_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check if the note was deleted
        self.assertEqual(Note.objects.filter(user=self.user).count(), initial_count - 1)
        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(pk=self.note1.pk)
    
    def test_cannot_delete_other_users_note(self):
        """Test that a user cannot delete another user's note"""
        response = self.client.delete(self.other_user_note_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verify the other user's note still exists
        self.assertTrue(Note.objects.filter(pk=self.other_user_note.pk).exists())

    def test_note_with_nonexistent_category(self):
        """Test creating a note with a non-existent category"""
        invalid_category_data = {
            'title': 'Bad Category Note',
            'content': 'This note has an invalid category.',
            'date': '2023-05-15',
            'category_id': 999  # Non-existent category ID
        }
        
        response = self.client.post(
            self.list_url,
            data=json.dumps(invalid_category_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_unauthenticated_access(self):
        """Test that unauthenticated requests are rejected"""
        # Remove authentication
        self.client.credentials()
        
        # Test list endpoint
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test detail endpoint
        response = self.client.get(self.note1_detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test create endpoint
        response = self.client.post(
            self.list_url,
            data=json.dumps(self.valid_payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)