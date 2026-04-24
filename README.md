---
title: AutoValuate
emoji: 🚗
colorFrom: red
colorTo: purple
sdk: docker
pinned: false
license: mit
---

<div align="center">

# 🚗 AutoValuate
### AI-Powered Used Car Price Intelligence Platform

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-AutoValuate-E63946?style=for-the-badge)](https://mantra21-autovaluate.hf.space)
[![Hugging Face](https://img.shields.io/badge/🤗_Hugging_Face-Mantra21/AutoValuate-FFD21E?style=for-the-badge)](https://huggingface.co/spaces/Mantra21/AutoValuate)
[![License: MIT](https://img.shields.io/badge/License-MIT-7B2D8B?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0.3-E63946?style=for-the-badge)](https://xgboost.readthedocs.io)

*Know the price. Make the move.*

</div>

---

## 📌 Overview

**AutoValuate** is a full-stack AI-powered used car marketplace that predicts the true market value of any used car using machine learning. Whether you are a **buyer** trying to spot a fair deal or a **seller** trying to price your car correctly — AutoValuate gives you the data-driven answer in seconds.

> ⚠️ **Important:** AutoValuate is a **price intelligence platform only**. No actual buying or selling transactions happen on this platform. Users see the predicted fair price and can list their car or evaluate a listing — but all transactions happen offline between buyer and seller.

---

## 🎯 Problem Statement

The Indian used car market is largely unorganized. Buyers have no reliable way to know if a car is fairly priced, overpriced, or a great deal. Sellers often underprice or overprice their cars due to lack of market data. AutoValuate solves this by bringing **AI-powered price transparency** to both sides of the transaction.

---

## ✨ Features

### 🛒 For Buyers
- Browse 200+ used car listings with AI fair value attached to every card
- Instantly see if a listing is **Great Deal ✓**, **Fair Price**, or **Overpriced**
- Filter by brand, fuel type, transmission, KM driven, price range, city, and owners
- Sort listings by price or deal quality
- View full car details including seller contact, specs, and AI factor breakdown

### 💰 For Sellers
- Enter your car details in a guided 3-step wizard
- Get an **AI-predicted market price** with confidence score
- See exactly what factors affect your car's value (brand, depreciation, KM, fuel, transmission)
- Get personalized tips to increase your car's resale value
- Post your listing directly on the platform

### 🤖 AI Engine
- XGBoost regression model trained on real Indian car market data
- Predicts price in Indian Rupees (Lakhs)
- Returns price range (low–high), confidence score, suggested listing price
- Factor breakdown showing percentage impact of each feature
- Dynamic tips generated based on car attributes

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Python 3.11, FastAPI |
| **ML Model** | XGBoost Regressor |
| **Data Processing** | Pandas, NumPy, Scikit-learn |
| **Model Serialization** | Joblib |
| **Deployment** | Hugging Face Spaces (Docker) |
| **Dataset** | CardEkho Used Car Dataset (Kaggle) |

---

## 📁 Project Structure

```
AutoValuate/
│
├── 🌐 Frontend
│   ├── index.html          # Main single-page application
│   ├── style.css           # Premium dark theme styling
│   └── app.js              # All frontend logic and API calls
│
├── 🐍 Backend (FastAPI)
│   ├── main.py             # FastAPI app + all API endpoints
│   ├── predict.py          # ML prediction engine
│   ├── preprocessing.py    # Data cleaning pipeline
│   └── train.py            # Model training script
│
├── 🤖 ML Artifacts
│   ├── model.pkl           # Trained XGBoost model
│   ├── encoder.pkl         # Label encoders for categorical features
│   └── scaler.pkl          # StandardScaler for numerical features
│
├── 📊 Data
│   ├── dataset.csv         # CardEkho used car dataset
│   └── listings.json       # User-submitted listings storage
│
└── 🐳 Deployment
    ├── Dockerfile          # Docker config for HF Spaces
    ├── requirements.txt    # Python dependencies
    ├── README.md           # This file
    └── .gitattributes      # Git LFS config for large files
```

---

## 🧠 Machine Learning Model

### Dataset
- **Source:** CardEkho Used Car Dataset (Kaggle)
- **Size:** 8,000+ real Indian car listings
- **Target Variable:** Selling price (in Indian Rupees Lakhs)

### Features Used

| Type | Features |
|---|---|
| **Categorical** | Brand, Fuel Type, Transmission, Seller Type, Owner |
| **Numerical** | Car Age, KM Driven, Mileage (kmpl), Engine (CC), Max Power (bhp), Seats |

### Preprocessing Pipeline
1. Extract brand name from full car name string
2. Parse numeric values from strings (e.g. "1197 CC" → 1197.0)
3. Create car age feature: `age = 2025 - year`
4. Convert selling price to Lakhs
5. Label encode all categorical features
6. StandardScaler on all numerical features
7. Drop rows with null values in critical columns

### Models Trained & Compared

| Model | MAE | RMSE | R² Score |
|---|---|---|---|
| Random Forest | ~1.2L | ~2.1L | ~0.89 |
| Gradient Boosting | ~1.1L | ~1.9L | ~0.91 |
| **XGBoost** ✅ | **~0.9L** | **~1.7L** | **~0.93** |

**XGBoost** was selected as the best model with ~93% R² accuracy.

### Top Feature Importances
1. Max Power (bhp) — strongest predictor
2. Engine CC
3. Car Age
4. KM Driven
5. Brand
6. Fuel Type
7. Transmission

---

## 🔌 API Reference

Base URL: `https://mantra21-autovaluate.hf.space`

### `GET /api/health`
Health check endpoint.

```json
{
  "status": "ok",
  "message": "AutoValuate API is running",
  "version": "1.0.0"
}
```

---

### `POST /api/predict`
Predict the fair market value of a car.

**Request Body:**
```json
{
  "brand": "Maruti",
  "model": "Swift",
  "year": 2019,
  "km_driven": 45000,
  "fuel_type": "Petrol",
  "transmission": "Manual",
  "owner": "First Owner",
  "mileage": 21.5,
  "engine": 1197.0,
  "max_power": 82.0,
  "seats": 5,
  "seller_type": "Individual",
  "city": "Ahmedabad",
  "condition": "Good"
}
```

**Response:**
```json
{
  "predicted_price": 6.45,
  "price_range": { "low": 5.87, "high": 7.03 },
  "confidence": 92,
  "currency": "INR Lakhs",
  "suggested_listing_price": 6.71,
  "factors": {
    "brand_impact": 24,
    "depreciation_impact": 31,
    "km_impact": 18,
    "fuel_impact": 13,
    "transmission_impact": 14
  },
  "tips": [
    "First-owner cars command a premium — make sure to highlight this",
    "Good fuel efficiency is a key selling point — mention it prominently"
  ]
}
```

---

### `POST /api/predict-buy`
Predict price and compare with a listing price.

**Additional field:** `"listing_price": 7.5`

**Additional response fields:**
```json
{
  "deal_verdict": "Overpriced",
  "price_difference": 1.05,
  "price_difference_pct": 16.3,
  "recommendation": "Negotiate down to ₹6.45L for a fair deal"
}
```

---

### `GET /api/listings`
Returns all car listings (user-submitted + dataset sample) with AI prices attached.

### `POST /api/listings`
Submit a new car listing.

### `GET /api/brands`
Returns all unique car brands from the dataset.

### `GET /api/models/{brand}`
Returns all models for a given brand.

---

## 🚀 Local Setup & Run

### Prerequisites
- Python 3.11+
- pip

### Steps

```bash
# 1. Clone the repository
git clone https://huggingface.co/spaces/Mantra21/AutoValuate
cd AutoValuate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Train the model (optional — model.pkl already included)
python train.py

# 4. Start the server
uvicorn main:app --reload --port 8000

# 5. Open in browser
# http://localhost:8000
```

### API Documentation (Swagger UI)
```
http://localhost:8000/docs
```

---

## 🐳 Docker Setup

```bash
# Build the Docker image
docker build -t autovaluate .

# Run the container
docker run -p 7860:7860 autovaluate

# Open in browser
# http://localhost:7860
```

---

## 🌐 Deployment (Hugging Face Spaces)

This project is deployed on **Hugging Face Spaces** using the Docker SDK.

The Dockerfile:
- Uses `python:3.11-slim` base image
- Installs all dependencies from `requirements.txt`
- Runs FastAPI on port `7860` (required by HF Spaces)
- Serves both the frontend (HTML/CSS/JS) and backend API from a single server

**Live URL:** https://mantra21-autovaluate.hf.space

---

## 🎨 Design System

- **Theme:** Dark luxury / Obsidian Crimson
- **Primary Color:** `#E63946` (Crimson Red)
- **Background:** `#06050A` (Deep Obsidian Black)
- **Accent:** `#7B2D8B` (Violet), `#2EC4B6` (Teal)
- **Fonts:** Playfair Display (headings), Space Grotesk (body), JetBrains Mono (labels)

---

## 📊 Project Stats

| Metric | Value |
|---|---|
| Dataset Size | 8,000+ listings |
| Model Accuracy | ~93% R² Score |
| API Endpoints | 7 |
| Frontend Pages | 3 (Home, Buy, Sell) |
| Supported Brands | 30+ Indian & International |
| Deployment | Hugging Face Spaces (Free) |

---

## 🗺️ Roadmap

- [ ] Add price history chart (trend over time)
- [ ] Car comparison tool (side-by-side)
- [ ] Persistent database (PostgreSQL via Supabase)
- [ ] User authentication (login/signup)
- [ ] Mobile app version
- [ ] Support for more cities and international markets
- [ ] Real-time listing scraping from CarDekho/CarDheko

---

## 👨‍💻 Developer

**Mantra Patel**
- 🎓 B.Tech Computer Science & Engineering — Unitedworld Institute of Technology, Ahmedabad
- 🏆 SIH 2025 Inter-College Round Participant
- 💼 Targeting Google & Optiver | Building toward top-tier tech & quant roles
- 🤗 Hugging Face: [@Mantra21](https://huggingface.co/Mantra21)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License — Free to use, modify, and distribute with attribution.
```

---

## 🙏 Acknowledgements

- **CardEkho** — for the used car dataset
- **Kaggle** — dataset hosting platform
- **Hugging Face** — free deployment infrastructure
- **FastAPI** — modern Python web framework
- **XGBoost** — gradient boosting library

---

<div align="center">

**Built with ❤️ by Mantra Patel**

⭐ Star this repo if you found it useful!

[🌐 Live Demo](https://mantra21-autovaluate.hf.space) · [🤗 HF Space](https://huggingface.co/spaces/Mantra21/AutoValuate) · [📧 Contact](https://huggingface.co/Mantra21)

</div>
