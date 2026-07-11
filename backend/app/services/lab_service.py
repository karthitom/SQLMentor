import sqlite3
import structlog
from typing import Dict, Any, List, Optional
from app.models.lab import Lab

log = structlog.get_logger()

class LabService:
    def __init__(self, db_client):
        self.db = db_client
        self.labs_ref = self.db.collection("labs")

    async def get_lab(self, lab_id: str) -> Optional[Lab]:
        doc = self.labs_ref.document(lab_id).get()
        if doc.exists:
            return Lab(**doc.to_dict())
        return None

    def execute_query(self, setup_sql: str, query: str) -> Dict[str, Any]:
        """
        Execute an educational query in an isolated, in-memory SQLite database.
        This provides a safe playground environment that resets immediately.
        """
        conn = sqlite3.connect(":memory:")
        try:
            # First, run the setup SQL to create tables and insert mock data
            conn.executescript(setup_sql)
            
            # Then run the user's query
            cursor = conn.cursor()
            cursor.execute(query)
            
            # Fetch results
            if cursor.description:
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()
                results = [dict(zip(columns, row)) for row in rows]
                return {"success": True, "results": results}
            else:
                conn.commit()
                return {"success": True, "results": [{"message": "Query executed successfully. No rows returned."}]}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
