from flask import Blueprint, jsonify, request, session
import os
try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    pass


api = Blueprint('api', __name__, url_prefix='/api')

def get_db_conn():
    from app import get_db_connection
    return get_db_connection()

@api.route('/requests', methods=['GET'])
def list_requests():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    conn = get_db_conn()
    if 'psycopg2' in str(type(conn)):
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute('SELECT * FROM requests ORDER BY created_at DESC')
        rows = cursor.fetchall()
        result = [dict(r) for r in rows]
    else:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM requests ORDER BY created_at DESC')
        rows = cursor.fetchall()
        result = [dict(r) for r in rows]
    conn.close()
    return jsonify({"requests": result})

@api.route('/ai/categorize', methods=['POST'])
def ai_categorize():
    data = request.json
    purpose = data.get('purpose', '')

    # Mock AI categorization logic
    category = "Other"
    purpose_lower = purpose.lower()

    if any(word in purpose_lower for word in ['travel', 'flight', 'hotel', 'taxi', 'uber']):
        category = "Travel"
    elif any(word in purpose_lower for word in ['food', 'lunch', 'dinner', 'meal', 'restaurant']):
        category = "Meals & Entertainment"
    elif any(word in purpose_lower for word in ['office', 'supplies', 'paper', 'ink', 'pen']):
        category = "Office Supplies"
    elif any(word in purpose_lower for word in ['software', 'subscription', 'aws', 'cloud', 'domain']):
        category = "Software & IT"

    return jsonify({"category": category, "confidence": 0.85})
