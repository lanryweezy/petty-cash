from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import os
from datetime import datetime
import secrets

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect('petty_cash.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            is_first_login BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            purpose TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_by INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (approved_by) REFERENCES users (id)
        )
    ''')
    
    # Receipts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            request_id INTEGER,
            filename TEXT NOT NULL,
            description TEXT,
            amount REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (request_id) REFERENCES requests (id)
        )
    ''')
    
    # Logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('petty_cash.db')
    conn.row_factory = sqlite3.Row
    return conn

def log_action(user_id, action):
    """Log user action"""
    conn = get_db_connection()
    conn.execute('INSERT INTO logs (user_id, action) VALUES (?, ?)', (user_id, action))
    conn.commit()
    conn.close()

def require_login(f):
    """Decorator to require login"""
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def require_admin(f):
    """Decorator to require admin role"""
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        conn = get_db_connection()
        user = conn.execute('SELECT role FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        conn.close()
        
        if not user or user['role'] != 'admin':
            flash('Admin access required.', 'error')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            session['name'] = user['name']
            
            log_action(user['id'], f'User {username} logged in')
            
            if user['is_first_login']:
                return redirect(url_for('change_password', first_login=1))
            
            flash(f'Welcome back, {user["name"]}!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    if 'user_id' in session:
        log_action(session['user_id'], f'User {session["username"]} logged out')
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

@app.route('/change_password', methods=['GET', 'POST'])
@require_login
def change_password():
    first_login = request.args.get('first_login', False)
    
    if request.method == 'POST':
        current_password = request.form.get('current_password')
        new_password = request.form['new_password']
        confirm_password = request.form['confirm_password']
        
        if new_password != confirm_password:
            flash('New passwords do not match.', 'error')
            return render_template('change_password.html', first_login=first_login)
        
        if len(new_password) < 6:
            flash('Password must be at least 6 characters long.', 'error')
            return render_template('change_password.html', first_login=first_login)
        
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        
        # Verify current password for non-first-login
        if not first_login and not check_password_hash(user['password_hash'], current_password):
            flash('Current password is incorrect.', 'error')
            conn.close()
            return render_template('change_password.html', first_login=first_login)
        
        # Update password
        new_hash = generate_password_hash(new_password)
        conn.execute('UPDATE users SET password_hash = ?, is_first_login = 0 WHERE id = ?', 
                    (new_hash, session['user_id']))
        conn.commit()
        conn.close()
        
        log_action(session['user_id'], 'Password changed')
        flash('Password updated successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('change_password.html', first_login=first_login)

@app.route('/dashboard')
@require_login
def dashboard():
    conn = get_db_connection()
    
    # Get user's requests
    requests = conn.execute('''
        SELECT r.*, u.name as approved_by_name 
        FROM requests r 
        LEFT JOIN users u ON r.approved_by = u.id 
        WHERE r.user_id = ? 
        ORDER BY r.created_at DESC
    ''', (session['user_id'],)).fetchall()
    
    # Get recent receipts
    receipts = conn.execute('''
        SELECT r.*, req.purpose 
        FROM receipts r 
        LEFT JOIN requests req ON r.request_id = req.id 
        WHERE r.user_id = ? 
        ORDER BY r.created_at DESC LIMIT 5
    ''', (session['user_id'],)).fetchall()
    
    conn.close()
    
    return render_template('dashboard.html', requests=requests, receipts=receipts)

@app.route('/create_request', methods=['GET', 'POST'])
@require_login
def create_request():
    if request.method == 'POST':
        purpose = request.form['purpose']
        amount = float(request.form['amount'])
        
        conn = get_db_connection()
        conn.execute('INSERT INTO requests (user_id, purpose, amount) VALUES (?, ?, ?)',
                    (session['user_id'], purpose, amount))
        conn.commit()
        conn.close()
        
        log_action(session['user_id'], f'Created request: {purpose} - ${amount:.2f}')
        flash('Request created successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('create_request.html')

@app.route('/upload_receipt', methods=['GET', 'POST'])
@require_login
def upload_receipt():
    if request.method == 'POST':
        file = request.files['receipt']
        description = request.form['description']
        amount = float(request.form['amount'])
        request_id = request.form.get('request_id')
        
        if file and file.filename:
            filename = secure_filename(file.filename)
            # Add timestamp to avoid conflicts
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
            filename = timestamp + filename
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            
            conn = get_db_connection()
            conn.execute('''
                INSERT INTO receipts (user_id, request_id, filename, description, amount) 
                VALUES (?, ?, ?, ?, ?)
            ''', (session['user_id'], request_id if request_id else None, filename, description, amount))
            conn.commit()
            conn.close()
            
            log_action(session['user_id'], f'Uploaded receipt: {description} - ${amount:.2f}')
            flash('Receipt uploaded successfully!', 'success')
            return redirect(url_for('dashboard'))
    
    # Get user's approved requests for dropdown
    conn = get_db_connection()
    approved_requests = conn.execute('''
        SELECT * FROM requests 
        WHERE user_id = ? AND status = 'approved' 
        ORDER BY created_at DESC
    ''', (session['user_id'],)).fetchall()
    conn.close()
    
    return render_template('upload_receipt.html', requests=approved_requests)

@app.route('/approvals')
@require_login
def approvals():
    conn = get_db_connection()
    user = conn.execute('SELECT role FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    if user['role'] not in ['admin', 'approver']:
        flash('You do not have permission to view approvals.', 'error')
        return redirect(url_for('dashboard'))
    
    # Get pending requests
    pending_requests = conn.execute('''
        SELECT r.*, u.name as user_name 
        FROM requests r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.status = 'pending' 
        ORDER BY r.created_at ASC
    ''').fetchall()
    
    conn.close()
    return render_template('approvals.html', requests=pending_requests)

@app.route('/approve_request/<int:request_id>')
@require_login
def approve_request(request_id):
    conn = get_db_connection()
    user = conn.execute('SELECT role FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    if user['role'] not in ['admin', 'approver']:
        flash('You do not have permission to approve requests.', 'error')
        return redirect(url_for('dashboard'))
    
    conn.execute('''
        UPDATE requests 
        SET status = 'approved', approved_by = ? 
        WHERE id = ? AND status = 'pending'
    ''', (session['user_id'], request_id))
    conn.commit()
    
    # Log the approval
    request_info = conn.execute('SELECT purpose, amount FROM requests WHERE id = ?', (request_id,)).fetchone()
    conn.close()
    
    log_action(session['user_id'], f'Approved request: {request_info["purpose"]} - ${request_info["amount"]:.2f}')
    flash('Request approved successfully!', 'success')
    return redirect(url_for('approvals'))

@app.route('/reject_request/<int:request_id>')
@require_login
def reject_request(request_id):
    conn = get_db_connection()
    user = conn.execute('SELECT role FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    if user['role'] not in ['admin', 'approver']:
        flash('You do not have permission to reject requests.', 'error')
        return redirect(url_for('dashboard'))
    
    conn.execute('UPDATE requests SET status = "rejected" WHERE id = ? AND status = "pending"', (request_id,))
    conn.commit()
    
    # Log the rejection
    request_info = conn.execute('SELECT purpose, amount FROM requests WHERE id = ?', (request_id,)).fetchone()
    conn.close()
    
    log_action(session['user_id'], f'Rejected request: {request_info["purpose"]} - ${request_info["amount"]:.2f}')
    flash('Request rejected.', 'info')
    return redirect(url_for('approvals'))

@app.route('/users')
@require_admin
def user_management():
    conn = get_db_connection()
    users = conn.execute('SELECT * FROM users ORDER BY created_at DESC').fetchall()
    conn.close()
    return render_template('users.html', users=users)

@app.route('/create_user', methods=['GET', 'POST'])
@require_admin
def create_user():
    if request.method == 'POST':
        username = request.form['username']
        name = request.form['name']
        role = request.form['role']
        temp_password = secrets.token_urlsafe(8)
        
        conn = get_db_connection()
        
        # Check if username exists
        existing = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
        if existing:
            flash('Username already exists.', 'error')
            conn.close()
            return render_template('create_user.html')
        
        # Create user
        password_hash = generate_password_hash(temp_password)
        conn.execute('''
            INSERT INTO users (username, password_hash, name, role, is_first_login) 
            VALUES (?, ?, ?, ?, 1)
        ''', (username, password_hash, name, role))
        conn.commit()
        conn.close()
        
        log_action(session['user_id'], f'Created user: {username} ({role})')
        flash(f'User created! Temporary password: {temp_password}', 'success')
        return redirect(url_for('user_management'))
    
    return render_template('create_user.html')

@app.route('/create_default_admin', methods=['POST'])
def create_default_admin():
    """Create default admin user if no users exist"""
    conn = get_db_connection()
    user_count = conn.execute('SELECT COUNT(*) as count FROM users').fetchone()['count']
    
    if user_count > 0:
        conn.close()
        return jsonify({'error': 'Users already exist'}), 400
    
    # Create default admin
    password_hash = generate_password_hash('admin123')
    conn.execute('''
        INSERT INTO users (username, password_hash, name, role, is_first_login) 
        VALUES (?, ?, ?, ?, 0)
    ''', ('admin', password_hash, 'Administrator', 'admin'))
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Default admin created',
        'username': 'admin',
        'password': 'admin123'
    })

@app.route('/logs')
@require_admin
def view_logs():
    conn = get_db_connection()
    logs = conn.execute('''
        SELECT l.*, u.username, u.name 
        FROM logs l 
        JOIN users u ON l.user_id = u.id 
        ORDER BY l.created_at DESC 
        LIMIT 100
    ''').fetchall()
    conn.close()
    return render_template('logs.html', logs=logs)

if __name__ == '__main__':
    init_db()
    
    # Create default admin if no users exist
    conn = get_db_connection()
    user_count = conn.execute('SELECT COUNT(*) as count FROM users').fetchone()['count']
    if user_count == 0:
        password_hash = generate_password_hash('admin123')
        conn.execute('''
            INSERT INTO users (username, password_hash, name, role, is_first_login) 
            VALUES (?, ?, ?, ?, 0)
        ''', ('admin', password_hash, 'Administrator', 'admin'))
        conn.commit()
        print("Default admin created: username=admin, password=admin123")
    conn.close()
    
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))