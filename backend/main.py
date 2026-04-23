"""
AutoValuate — FastAPI Backend
REST API for car price prediction and listing management.
"""

import os
import json
import uuid
import pandas as pd
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from predict import predict_price, predict_with_verdict

# ─── App Setup ───────────────────────────────────────────────
app = FastAPI(
    title="AutoValuate API",
    description="AI-powered used car price prediction engine",
    version="1.0.0",
)

# ─── CORS ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Paths ───────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(__file__)
DATASET_PATH  = os.path.join(BASE_DIR, "dataset.csv")
LISTINGS_PATH = os.path.join(BASE_DIR, "listings.json")

# ─── Pydantic Models ────────────────────────────────────────
class CarInput(BaseModel):
    brand: str
    model: str = ""
    year: int
    km_driven: int
    fuel_type: str
    transmission: str
    owner: str
    mileage: float
    engine: float
    max_power: float
    seats: int = 5
    seller_type: str = "Individual"
    city: str = "Mumbai"
    condition: str = "Good"

class BuyPredictInput(CarInput):
    listing_price: float

class ListingInput(BaseModel):
    brand: str
    model: str = ""
    year: int
    km_driven: int
    fuel_type: str
    transmission: str
    owner: str
    mileage: float
    engine: float
    max_power: float
    seats: int = 5
    seller_type: str = "Individual"
    city: str = "Mumbai"
    condition: str = "Good"
    asking_price: float
    name: str = ""
    phone: str = ""
    description: str = ""


# ─── Helper: Load/Save listings ─────────────────────────────
def _load_listings() -> list:
    if os.path.exists(LISTINGS_PATH):
        with open(LISTINGS_PATH, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def _save_listings(listings: list):
    with open(LISTINGS_PATH, "w") as f:
        json.dump(listings, f, indent=2)


# ─── Helper: Get brands/models from dataset ─────────────────
_dataset_cache = None

def _get_dataset() -> pd.DataFrame:
    global _dataset_cache
    if _dataset_cache is None:
        _dataset_cache = pd.read_csv(DATASET_PATH)
        _dataset_cache["brand"] = _dataset_cache["name"].str.split().str[0]
    return _dataset_cache


# ═════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"message": "AutoValuate API is running", "version": "1.0.0"}


# ─── POST /predict ───────────────────────────────────────────
@app.post("/predict")
def predict(car: CarInput):
    """Predict the fair market value of a used car."""
    try:
        result = predict_price(
            brand=car.brand,
            year=car.year,
            km_driven=car.km_driven,
            fuel=car.fuel_type,
            transmission=car.transmission,
            owner=car.owner,
            mileage=car.mileage,
            engine=car.engine,
            max_power=car.max_power,
            seats=car.seats,
            seller_type=car.seller_type,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── POST /predict-buy ──────────────────────────────────────
@app.post("/predict-buy")
def predict_buy(car: BuyPredictInput):
    """Predict price and compare with listing price for deal verdict."""
    try:
        result = predict_with_verdict(
            listing_price=car.listing_price,
            brand=car.brand,
            year=car.year,
            km_driven=car.km_driven,
            fuel=car.fuel_type,
            transmission=car.transmission,
            owner=car.owner,
            mileage=car.mileage,
            engine=car.engine,
            max_power=car.max_power,
            seats=car.seats,
            seller_type=car.seller_type,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── GET /brands ─────────────────────────────────────────────
@app.get("/brands")
def get_brands():
    """Return all unique car brands from the dataset."""
    df = _get_dataset()
    brands = sorted(df["brand"].unique().tolist())
    return {"brands": brands}


# ─── GET /models/{brand} ────────────────────────────────────
@app.get("/models/{brand}")
def get_models(brand: str):
    """Return all models for a given brand."""
    df = _get_dataset()
    brand_df = df[df["brand"].str.lower() == brand.lower()]
    if brand_df.empty:
        return {"models": []}
    # Extract model name by removing brand from full name
    models = brand_df["name"].apply(
        lambda x: " ".join(x.split()[1:]) if len(x.split()) > 1 else x
    ).unique().tolist()
    return {"models": sorted(models)[:50]}


# ─── GET /listings ───────────────────────────────────────────
@app.get("/listings")
def get_listings():
    """Return all listings — user-submitted + a large sample from dataset."""
    user_listings = _load_listings()

    # Generate a large set of mock listings from the dataset
    df = _get_dataset()
    
    # Increase sample size to 200 for a better "Buy" experience
    sample_size = min(200, len(df))
    sample = df.sample(sample_size, random_state=42).copy()
    
    import re, random
    random.seed(42)

    mock_listings = []
    cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Pune",
              "Hyderabad", "Ahmedabad", "Kolkata", "Jaipur", "Surat",
              "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal"]
    
    conditions = ["Excellent", "Good", "Good", "Good", "Fair", "Excellent", "Good"]
    
    seller_names = [
        "Rahul S.", "Priya M.", "Amit K.", "Sneha D.", "Vijay R.",
        "Anita P.", "Karan T.", "Neha G.", "Rohan B.", "Deepa L.",
        "Suresh N.", "Meera C.", "Arjun W.", "Kavita H.", "Nikhil J.",
        "Pooja F.", "Rakesh Y.", "Swati Z.", "Manoj V.", "Divya U.",
        "Sanjay Q.", "Ritu A.", "Vikram I.", "Pallavi O.", "Yash K.",
        "Simran B.", "Gaurav P.", "Isha R.", "Manish T.", "Tanvi S."
    ]

    for i, (_, row) in enumerate(sample.iterrows()):
        try:
            brand = str(row["name"]).split()[0]
            model_full = str(row["name"])
            model_name = " ".join(model_full.split()[1:]) if len(model_full.split()) > 1 else model_full

            # Parse numeric values
            def parse_num(val, default=0):
                if pd.isna(val):
                    return default
                m = re.search(r"[\d.]+", str(val))
                return float(m.group()) if m else default

            engine_val = parse_num(row.get("engine"), 1200)
            power_val  = parse_num(row.get("max_power"), 80)
            mileage_val = parse_num(row.get("mileage"), 15.0)
            
            selling_price = float(row["selling_price"])
            listing_price = round(selling_price / 100000, 2)

            # Get AI predicted price (using the model if possible)
            try:
                pred = predict_price(
                    brand=brand,
                    year=int(row["year"]),
                    km_driven=int(row["km_driven"]),
                    fuel=str(row["fuel"]),
                    transmission=str(row["transmission"]),
                    owner=str(row["owner"]),
                    mileage=mileage_val if mileage_val > 0 else 15.0,
                    engine=engine_val if engine_val > 0 else 1200,
                    max_power=power_val if power_val > 0 else 80,
                    seats=int(row["seats"]) if not pd.isna(row.get("seats")) else 5,
                    seller_type=str(row["seller_type"]),
                )
                ai_price = pred["predicted_price"]
            except:
                # Fallback: AI price slightly different from listed price
                ai_price = round(listing_price * random.uniform(0.92, 1.08), 2)

            # Deal verdict
            if listing_price > ai_price * 1.08:
                verdict = "Overpriced"
            elif listing_price < ai_price * 0.93:
                verdict = "Great Deal"
            else:
                verdict = "Fair Price"

            city = cities[i % len(cities)]
            condition = conditions[i % len(conditions)]

            mock_listings.append({
                "id": f"DS-{i+1:03d}",
                "brand": brand,
                "model": model_name,
                "year": int(row["year"]),
                "km_driven": int(row["km_driven"]),
                "fuel": str(row["fuel"]),
                "transmission": str(row["transmission"]),
                "owner": str(row["owner"]),
                "seller_type": str(row["seller_type"]),
                "mileage": mileage_val,
                "engine": engine_val,
                "max_power": power_val,
                "seats": int(row["seats"]) if not pd.isna(row.get("seats")) else 5,
                "listing_price": listing_price,
                "ai_price": ai_price,
                "deal_verdict": verdict,
                "city": city,
                "condition": condition,
                "seller_name": seller_names[i % len(seller_names)],
                "seller_phone": f"+91 9{random.randint(7,9)}{random.randint(10,99)} {random.randint(10000,99999)}",
                "description": f"Excellent {brand} {model_name} from {row['year']}. Driven {row['km_driven']:,} km. Located in {city}.",
            })
        except Exception as e:
            # Skip rows with major parsing errors
            continue

    return {"listings": user_listings + mock_listings}


# ─── POST /listings ──────────────────────────────────────────
@app.post("/listings")
def create_listing(listing: ListingInput):
    """Save a new user-submitted listing."""
    listings = _load_listings()

    listing_id = f"AV-{uuid.uuid4().hex[:8].upper()}"

    # Get AI price
    try:
        pred = predict_price(
            brand=listing.brand,
            year=listing.year,
            km_driven=listing.km_driven,
            fuel=listing.fuel_type,
            transmission=listing.transmission,
            owner=listing.owner,
            mileage=listing.mileage,
            engine=listing.engine,
            max_power=listing.max_power,
            seats=listing.seats,
            seller_type=listing.seller_type,
        )
        ai_price = pred["predicted_price"]
    except:
        ai_price = listing.asking_price

    new_listing = {
        "id": listing_id,
        "brand": listing.brand,
        "model": listing.model,
        "year": listing.year,
        "km_driven": listing.km_driven,
        "fuel": listing.fuel_type,
        "transmission": listing.transmission,
        "owner": listing.owner,
        "mileage": listing.mileage,
        "engine": listing.engine,
        "max_power": listing.max_power,
        "seats": listing.seats,
        "seller_type": listing.seller_type,
        "city": listing.city,
        "condition": listing.condition,
        "listing_price": listing.asking_price,
        "ai_price": ai_price,
        "seller_name": listing.name,
        "seller_phone": listing.phone,
        "description": listing.description,
        "deal_verdict": "Fair Price",
    }

    listings.append(new_listing)
    _save_listings(listings)

    return {"listing_id": listing_id, "message": "Listing created successfully", "listing": new_listing}


# ─── GET /listings/{id} ─────────────────────────────────────
@app.get("/listings/{listing_id}")
def get_listing(listing_id: str):
    """Return a single listing by ID."""
    # Check user listings
    listings = _load_listings()
    for l in listings:
        if l["id"] == listing_id:
            return l

    # Check mock listings
    all_listings = get_listings()
    for l in all_listings["listings"]:
        if l["id"] == listing_id:
            return l

    raise HTTPException(status_code=404, detail="Listing not found")
