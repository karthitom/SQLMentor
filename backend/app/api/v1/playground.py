from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.lab_service import LabService

router = APIRouter()

class PlaygroundRequest(BaseModel):
    query: str
    scenario_id: str = "default"

@router.post("/execute")
async def execute_playground_query(
    req: PlaygroundRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Execute arbitrary SQL queries in a safe playground environment."""
    # A generic setup SQL with a mock users and products table
    setup_sql = '''
    CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT);
    INSERT INTO users (username, password, role) VALUES ('admin', 'supersecret', 'admin');
    INSERT INTO users (username, password, role) VALUES ('john', 'password123', 'user');
    
    CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, description TEXT, price REAL);
    INSERT INTO products (name, description, price) VALUES ('Laptop', 'High-end gaming laptop', 1200.0);
    INSERT INTO products (name, description, price) VALUES ('Mouse', 'Wireless mouse', 25.0);
    '''
    
    lab_service = LabService(db)
    result = lab_service.execute_query(setup_sql, req.query)
    
    return result
