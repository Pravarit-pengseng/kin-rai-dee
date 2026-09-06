import random
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from app.db import supabase

router = APIRouter(prefix="/api", tags=["Foods & Ingredients"])

@router.get("/foods")
def get_foods(category_id: Optional[int] = None):
    """Fetch food items, optionally filtered by category_id."""
    if not supabase:
        return []
    try:
        query = supabase.table("foods").select("*")
        if category_id is not None:
            query = query.eq("category_id", category_id)
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ingredients")
def get_ingredients(category_id: Optional[int] = None):
    """Fetch ingredient items, optionally filtered by category_id."""
    if not supabase:
        return []
    try:
        query = supabase.table("ingredients").select("*")
        if category_id is not None:
            query = query.eq("category_id", category_id)
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/random/food")
def get_random_food(category_ids: Optional[str] = None):
    """Get a random food item, filtered by selected category IDs if provided."""
    if not supabase:
        return None
    try:
        query = supabase.table("foods").select("*")
        if category_ids and isinstance(category_ids, str):
            cat_list = [int(c.strip()) for c in category_ids.split(",") if c.strip().isdigit()]
            if cat_list:
                query = query.in_("category_id", cat_list)
        response = query.execute()
        items = response.data
        if not items:
            return None
        return random.choice(items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/random/ingredient")
def get_random_ingredient(
    veg: bool = False,
    meat: bool = False,
    category_ids: Optional[str] = None
):
    """Get random ingredient(s). Returns a dict with 'veg' and/or 'meat' items."""
    if not supabase:
        return {"veg": None, "meat": None}
    try:
        result = {"veg": None, "meat": None}
        
        # If explicit category_ids is provided as string
        if category_ids and isinstance(category_ids, str):
            cat_list = [int(c.strip()) for c in category_ids.split(",") if c.strip().isdigit()]
            if cat_list:
                resp = supabase.table("ingredients").select("*").in_("category_id", cat_list).execute()
                items = resp.data
                if items:
                    result["veg"] = random.choice(items)
                return result

        # Category IDs in DB: 1 = ผัก (Vegetables), 2 = เนื้อสัตว์ (Meat)
        veg_cat_id = 1
        meat_cat_id = 2

        if veg:
            veg_resp = supabase.table("ingredients").select("*").eq("category_id", veg_cat_id).execute()
            if veg_resp.data:
                result["veg"] = random.choice(veg_resp.data)
                
        if meat:
            meat_resp = supabase.table("ingredients").select("*").eq("category_id", meat_cat_id).execute()
            if meat_resp.data:
                result["meat"] = random.choice(meat_resp.data)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
