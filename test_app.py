import pytest
import os
import json
from app import app, init_db, get_db_connection

@pytest.fixture
def client():
    # Configure app for testing
    app.config['TESTING'] = True
    app.secret_key = 'test-key'

    # Use an in-memory SQLite database for testing if possible,
    # or a temporary file. Since init_db uses the get_db_connection logic,
    # let's set VERCEL=1 to force it into /tmp/petty_cash.db or just let it use local
    os.environ.pop('DATABASE_URL', None)

    with app.test_client() as client:
        with app.app_context():
            # Initialize the test database
            init_db()

            # Create a test user
            conn = get_db_connection()
            from werkzeug.security import generate_password_hash
            cursor = conn.cursor()
            # Clear existing data
            cursor.execute('DELETE FROM logs')
            cursor.execute('DELETE FROM receipts')
            cursor.execute('DELETE FROM requests')
            cursor.execute('DELETE FROM users')

            cursor.execute('''
                INSERT INTO users (username, password_hash, name, role, is_first_login)
                VALUES (?, ?, ?, ?, ?)
            ''', ('testuser', generate_password_hash('password123'), 'Test User', 'user', 0))

            cursor.execute('''
                INSERT INTO users (username, password_hash, name, role, is_first_login)
                VALUES (?, ?, ?, ?, ?)
            ''', ('adminuser', generate_password_hash('admin123'), 'Admin User', 'admin', 0))

            conn.commit()
            conn.close()

        yield client

def login(client, username, password):
    return client.post('/login', data=dict(
        username=username,
        password=password
    ), follow_redirects=True)

def logout(client):
    return client.get('/logout', follow_redirects=True)

def test_login_logout(client):
    """Test login and logout functionality"""
    # Test valid login
    rv = login(client, 'testuser', 'password123')
    assert b'Welcome back, Test User!' in rv.data

    # Test invalid login
    logout(client)
    rv = login(client, 'testuser', 'wrongpassword')
    assert b'Invalid username or password.' in rv.data

    # Test logout
    login(client, 'testuser', 'password123')
    rv = logout(client)
    assert b'You have been logged out.' in rv.data

def test_create_request(client):
    """Test creating a petty cash request"""
    login(client, 'testuser', 'password123')

    rv = client.post('/create_request', data=dict(
        purpose='Test Supplies',
        amount='50.00'
    ), follow_redirects=True)

    assert b'Request created successfully!' in rv.data
    assert b'Test Supplies' in rv.data
    assert b'$50.00' in rv.data

def test_api_unauthorized(client):
    """Test that API requires authentication"""
    rv = client.get('/api/requests')
    assert rv.status_code == 401

def test_api_authorized(client):
    """Test API with authentication"""
    login(client, 'testuser', 'password123')

    # Create a request first
    client.post('/create_request', data=dict(
        purpose='API Test Request',
        amount='100.00'
    ))

    rv = client.get('/api/requests')
    assert rv.status_code == 200
    data = json.loads(rv.data)
    assert 'requests' in data
    assert len(data['requests']) > 0
    assert data['requests'][0]['purpose'] == 'API Test Request'

def test_ai_categorize(client):
    """Test the AI categorize mock endpoint"""
    rv = client.post('/api/ai/categorize', json={'purpose': 'Uber to the airport'})
    assert rv.status_code == 200
    data = json.loads(rv.data)
    assert data['category'] == 'Travel'

    rv = client.post('/api/ai/categorize', json={'purpose': 'Lunch with client'})
    data = json.loads(rv.data)
    assert data['category'] == 'Meals & Entertainment'
