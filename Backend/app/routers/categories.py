from fastapi import APIRouter, HTTPException
from app.db import supabase

router = APIRouter(prefix="/api", tags=["Categories"])

@router.get("/categories")
def get_categories():
    """Fetch all food categories from Supabase categories table."""
    if not supabase:
        return []
    try:
        response = supabase.table("categories").select("*").order("id").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ingredient-categories")
def get_ingredient_categories():
    """Fetch all ingredient categories from Supabase ingredient_categories table."""
    if not supabase:
        return []
    try:
        response = supabase.table("ingredient_categories").select("*").order("id").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
