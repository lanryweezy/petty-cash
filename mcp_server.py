import json
import sys
import psycopg2
from psycopg2.extras import DictCursor
import os
import sqlite3

def get_db_connection():
    db_url = os.environ.get('DATABASE_URL')
    if db_url:
        conn = psycopg2.connect(db_url)
    else:
        conn = sqlite3.connect('/tmp/petty_cash.db' if os.environ.get('VERCEL') else 'petty_cash.db')
        conn.row_factory = sqlite3.Row
    return conn

def handle_request(request_str):
    try:
        req = json.loads(request_str)
        method = req.get('method')
        params = req.get('params', {})

        if method == 'list_requests':
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=DictCursor) if hasattr(conn, 'cursor_factory') else conn.cursor()
            cursor.execute('SELECT * FROM requests ORDER BY created_at DESC')
            rows = cursor.fetchall()
            conn.close()
            return {"result": [dict(r) for r in rows]}

        elif method == 'approve_request':
            request_id = params.get('request_id')
            user_id = params.get('user_id')
            conn = get_db_connection()
            cursor = conn.cursor()

            # Simple approval for MCP testing
            if isinstance(conn, sqlite3.Connection):
                cursor.execute('UPDATE requests SET status = ?, approved_by = ? WHERE id = ?',
                               ('approved', user_id, request_id))
            else:
                cursor.execute('UPDATE requests SET status = %s, approved_by = %s WHERE id = %s',
                               ('approved', user_id, request_id))
            conn.commit()
            conn.close()
            return {"result": {"success": True, "message": f"Request {request_id} approved"}}

        else:
            return {"error": {"code": -32601, "message": "Method not found"}}
    except Exception as e:
        return {"error": {"code": -32603, "message": str(e)}}

if __name__ == '__main__':
    # Simple JSON-RPC over stdin/stdout
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        response = handle_request(line)
        print(json.dumps(response))
        sys.stdout.flush()
