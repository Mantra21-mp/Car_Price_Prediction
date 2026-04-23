// API Config
const API_URL = 'http://localhost:8000';

// Global State
let allListings = [];
let filteredListings = [];
let uniqueBrands = [];

// Fallback Pricing Engine (Client-side)
const brandBase = {
  maruti:9, hyundai:11, honda:12, toyota:14, tata:10,
  mahindra:13, kia:15, ford:11, volkswagen:14,
  bmw:55, mercedes:65, audi:58, jaguar:70, volvo:52
};
const fuelMult = {petrol:1.0, diesel:1.08, cng:0.92, electric:1.3, hybrid:1.2};
const transMult = {manual:1.0, automatic:1.12, amt:1.05, cvt:1.10, dct:1.15};
const condMult = {excellent:1.0, good:0.87, fair:0.72, poor:0.55};
const ownerPenalty = [0, 0, 0.10, 0.18, 0.27];

function fallbackPredict(data) {
  const brand = data.brand.toLowerCase();
  const base = brandBase[brand] || 12;
  const age = 2025 - data.year;
  const depRate = (base > 40) ? 0.08 : 0.11;
  
  const fuel = data.fuel_type.toLowerCase();
  const trans = data.transmission.toLowerCase();
  const cond = data.condition ? data.condition.toLowerCase() : 'good';
  
  // Try to parse owners to a number or fallback
  let ownersIdx = 1;
  if (data.owner.includes('First')) ownersIdx = 1;
  else if (data.owner.includes('Second')) ownersIdx = 2;
  else if (data.owner.includes('Third')) ownersIdx = 3;
  else if (data.owner.includes('Fourth')) ownersIdx = 4;
  
  let price = base * (1 - depRate * age) 
    * (1 - Math.min(0.4, data.km_driven / 250000 * 0.4))
    * (fuelMult[fuel] || 1.0)
    * (transMult[trans] || 1.0)
    * (condMult[cond] || 0.87)
    * (1 - (ownerPenalty[ownersIdx] || 0));
    
  price = Math.max(price, 0.5); // Minimum price
  
  return {
    predicted_price: parseFloat(price.toFixed(2)),
    price_range: { low: parseFloat((price*0.91).toFixed(2)), high: parseFloat((price*1.09).toFixed(2)) },
    confidence: Math.floor(Math.random() * (96 - 87 + 1)) + 87,
    suggested_listing_price: parseFloat((price*1.04).toFixed(2)),
    factors: {
      brand_impact: (base > 40) ? 35 : 25,
      depreciation_impact: Math.min(45, parseInt(age * 4.5) + 5),
      km_impact: Math.min(30, parseInt((data.km_driven / 200000) * 30)),
      fuel_impact: fuel === 'diesel' ? 14 : 10,
      transmission_impact: trans === 'automatic' ? 12 : 6
    },
    tips: [
      "Fallback mode: Ensure your inputs are correct.",
      "Price varies by exact model and condition."
    ]
  };
}

// ─── Routing ────────────────────────────────────────────────
function navTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  
  document.getElementById(`page-${pageId}`).classList.add('active');
  const link = document.getElementById(`link-${pageId}`);
  if (link) link.classList.add('active');
  
  window.scrollTo(0, 0);
  
  if (pageId === 'buy') {
    initBuyPage();
  }
}

// ─── Toasts ─────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Buy Page Logic ─────────────────────────────────────────
async function initBuyPage() {
  if (allListings.length === 0) {
    try {
      const res = await fetch(`${API_URL}/listings`);
      if (res.ok) {
        const data = await res.json();
        allListings = data.listings || [];
      } else {
        throw new Error('Backend failed');
      }
    } catch (e) {
      console.warn("Failed to fetch listings from API, using fallback", e);
      generateMockListings();
    }
  }
  
  // Populate brand filter
  try {
    const res = await fetch(`${API_URL}/brands`);
    if (res.ok) {
      const data = await res.json();
      uniqueBrands = data.brands || [];
    }
  } catch (e) {}
  
  if (uniqueBrands.length === 0) {
    uniqueBrands = [...new Set(allListings.map(l => l.brand))].sort();
  }
  
  const brandSelect = document.getElementById('filter-brand');
  brandSelect.innerHTML = '<option value="">All Brands</option>';
  uniqueBrands.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.innerText = b;
    brandSelect.appendChild(opt);
  });
  
  applyFilters();
}

function generateMockListings() {
  // Generate 12 mock listings if API fails
  const brands = ['Honda', 'Hyundai', 'Maruti', 'Toyota', 'BMW', 'Mercedes-Benz'];
  const models = ['City', 'i20', 'Swift Dzire', 'Innova', '3 Series', 'C-Class'];
  const fuels = ['Petrol', 'Diesel'];
  const trans = ['Manual', 'Automatic'];
  
  for (let i = 0; i < 12; i++) {
    const bIdx = i % brands.length;
    const ai_price = (Math.random() * 20 + 3).toFixed(2);
    const listed_price = (ai_price * (Math.random() * 0.3 + 0.85)).toFixed(2); // +/- 15%
    
    let verdict = 'Fair Price';
    if (listed_price > ai_price * 1.08) verdict = 'Overpriced';
    if (listed_price < ai_price * 0.93) verdict = 'Great Deal';
    
    allListings.push({
      id: `FALLBACK-${i}`,
      brand: brands[bIdx],
      model: models[bIdx],
      year: 2015 + Math.floor(Math.random() * 8),
      fuel: fuels[i % 2],
      transmission: trans[Math.floor(Math.random() * 2)],
      km_driven: Math.floor(Math.random() * 100000),
      listing_price: listed_price,
      ai_price: ai_price,
      deal_verdict: verdict,
      seller_name: 'Demo Seller',
      seller_phone: '+91 9999900000',
      city: 'Mumbai',
      description: 'Fallback mock data.'
    });
  }
}

function applyFilters() {
  const fBrand = document.getElementById('filter-brand').value.toLowerCase();
  const fFuel = document.getElementById('filter-fuel').value.toLowerCase();
  const fTrans = document.getElementById('filter-trans').value.toLowerCase();
  const fKm = parseInt(document.getElementById('filter-km').value);
  const fPrice = parseFloat(document.getElementById('filter-price').value);
  const fCond = document.getElementById('filter-cond-val').innerText.toLowerCase();
  
  filteredListings = allListings.filter(l => {
    if (fBrand && l.brand.toLowerCase() !== fBrand) return false;
    if (fFuel && l.fuel.toLowerCase() !== fFuel) return false;
    if (fTrans && l.transmission.toLowerCase() !== fTrans) return false;
    if (l.km_driven > fKm) return false;
    if (parseFloat(l.listing_price) > fPrice) return false;
    if (l.condition && l.condition.toLowerCase() !== fCond) return false;
    return true;
  });
  
  sortListings('deal'); // default sort
}

function resetFilters() {
  document.getElementById('filter-brand').value = '';
  document.getElementById('filter-fuel').value = '';
  document.getElementById('filter-trans').value = '';
  document.getElementById('filter-km').value = 200000;
  document.getElementById('km-val').innerText = '200000 km';
  document.getElementById('filter-price').value = 100;
  document.getElementById('price-val').innerText = '₹100 L';
  
  // Reset condition to Good
  document.getElementById('filter-condition').value = 2;
  updateCondition(2, 'filter');
  
  applyFilters();
}

function sortListings(sortBy) {
  // Update UI active state
  document.querySelectorAll('.sort-options .pill').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  
  if (sortBy === 'price-asc') {
    filteredListings.sort((a, b) => parseFloat(a.listing_price) - parseFloat(b.listing_price));
  } else if (sortBy === 'price-desc') {
    filteredListings.sort((a, b) => parseFloat(b.listing_price) - parseFloat(a.listing_price));
  } else if (sortBy === 'deal') {
    // Sort by ratio: listing_price / ai_price (lower is better deal)
    filteredListings.sort((a, b) => {
      const ratioA = parseFloat(a.listing_price) / parseFloat(a.ai_price);
      const ratioB = parseFloat(b.listing_price) / parseFloat(b.ai_price);
      return ratioA - ratioB;
    });
  }
  
  renderBuyGrid();
}

function renderBuyGrid() {
  const grid = document.getElementById('car-grid');
  grid.innerHTML = '';
  document.getElementById('listing-count').innerText = `Showing ${filteredListings.length} listings`;
  
  filteredListings.forEach(car => {
    let badgeClass = 'badge-fair';
    if (car.deal_verdict === 'Great Deal') badgeClass = 'badge-great';
    if (car.deal_verdict === 'Overpriced') badgeClass = 'badge-over';
    
    const diff = parseFloat(car.listing_price) - parseFloat(car.ai_price);
    const diffPct = (Math.abs(diff) / parseFloat(car.ai_price) * 100).toFixed(1);
    let diffHtml = '';
    if (diff > 0.05) diffHtml = `<div class="price-diff diff-bad">↑ ${diffPct}% above fair value</div>`;
    if (diff < -0.05) diffHtml = `<div class="price-diff diff-good">↓ ${diffPct}% below fair value</div>`;
    
    // Generic car SVG
    const carSvg = `
      <svg width="100%" height="80%" viewBox="0 0 120 40" fill="none" stroke="var(--platinum)" stroke-width="1.5">
        <path d="M10,30 L20,30 C20,35 25,35 25,30 L75,30 C75,35 80,35 80,30 L110,30 L100,15 L70,10 L30,10 L15,15 Z"/>
        <circle cx="22.5" cy="30" r="4"/>
        <circle cx="77.5" cy="30" r="4"/>
      </svg>
    `;
    
    const card = document.createElement('div');
    card.className = 'car-card';
    card.onclick = () => openModal(car);
    card.innerHTML = `
      <div class="cc-img">
        ${carSvg}
        <div class="deal-badge ${badgeClass}">${car.deal_verdict}</div>
      </div>
      <div class="cc-body">
        <div class="cc-brand mono">${car.brand.toUpperCase()}</div>
        <div class="cc-title playfair">${car.model}</div>
        <div class="cc-tags">
          <span>${car.year}</span>
          <span>${car.fuel}</span>
          <span>${car.transmission}</span>
          <span>${(car.km_driven/1000).toFixed(1)}k km</span>
        </div>
        <div class="cc-divider"></div>
        <div class="cc-prices">
          <div class="price-col">
            <label>Listed At</label>
            <div class="price-listed">₹${car.listing_price}L</div>
          </div>
          <div class="price-col">
            <label>AI Fair Value</label>
            <div class="price-ai">₹${car.ai_price}L</div>
          </div>
          ${diffHtml}
        </div>
      </div>
      <div class="cc-hover-btn">View Details</div>
    `;
    grid.appendChild(card);
  });
}

// ─── Modal Logic ────────────────────────────────────────────
function openModal(car) {
  document.getElementById('mod-brand').innerText = car.brand.toUpperCase();
  document.getElementById('mod-title').innerText = car.model;
  document.getElementById('mod-tags').innerHTML = `
    <span class="fc-tag">${car.year}</span>
    <span class="fc-tag">${car.fuel}</span>
    <span class="fc-tag">${car.transmission}</span>
    <span class="fc-tag">${car.km_driven.toLocaleString()} km</span>
  `;
  document.getElementById('mod-list-price').innerText = `₹${car.listing_price}L`;
  document.getElementById('mod-ai-price').innerText = `₹${car.ai_price}L`;
  
  const verdictEl = document.getElementById('mod-verdict');
  verdictEl.innerText = car.deal_verdict;
  verdictEl.className = 'deal-badge'; // reset
  if (car.deal_verdict === 'Great Deal') verdictEl.classList.add('badge-great');
  else if (car.deal_verdict === 'Overpriced') verdictEl.classList.add('badge-over');
  else verdictEl.classList.add('badge-fair');
  
  document.getElementById('mod-seller-name').innerText = car.seller_name || 'Anonymous';
  document.getElementById('mod-seller-phone').innerText = car.seller_phone || 'Phone hidden';
  document.getElementById('mod-seller-city').innerText = car.city || 'Unknown Location';
  document.getElementById('mod-desc').innerText = car.description || 'No description provided.';
  
  document.getElementById('modal').classList.add('active');
}

function closeModal(e) {
  if (e) e.preventDefault();
  document.getElementById('modal').classList.remove('active');
}

// ─── Sell Wizard Logic ──────────────────────────────────────
let currentPrediction = null;

async function goToStep(step) {
  // Validate step 1
  if (step === 2 && document.getElementById('wizard-1').classList.contains('active')) {
    if (!document.getElementById('sell-model').value) {
      showToast('Please enter a model name', 'error');
      return;
    }
    
    // Hide all
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.getElementById('wizard-2').classList.add('active');
    
    // Update dots
    document.getElementById('dot-1').classList.replace('active', 'completed');
    document.getElementById('dot-2').classList.add('active');
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    
    // Cycle text
    const texts = ["Loading model...", "Calculating depreciation...", "Analysing market data...", "Done ✓"];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < texts.length) document.getElementById('loading-text').innerText = texts[i];
    }, 500);
    
    // Build payload
    const payload = {
      brand: document.getElementById('sell-brand').value,
      model: document.getElementById('sell-model').value,
      year: parseInt(document.getElementById('sell-year').value),
      km_driven: parseInt(document.getElementById('sell-km').value),
      fuel_type: document.getElementById('sell-fuel').value,
      transmission: document.getElementById('sell-trans').value,
      owner: document.getElementById('sell-owner').value,
      mileage: parseFloat(document.getElementById('sell-mileage').value),
      engine: parseFloat(document.getElementById('sell-engine').value),
      max_power: parseFloat(document.getElementById('sell-power').value),
      city: document.getElementById('sell-city').value,
      condition: document.getElementById('sell-cond-val').innerText
    };
    
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        currentPrediction = await res.json();
      } else {
        throw new Error('API Error');
      }
    } catch (e) {
      console.warn("API failed, using fallback engine");
      currentPrediction = fallbackPredict(payload);
    }
    
    setTimeout(() => {
      clearInterval(interval);
      populateResults(currentPrediction);
      document.getElementById('loading').style.display = 'none';
      document.getElementById('results').style.display = 'block';
    }, 2000);
    
    return;
  }
  

  
  if (step === 1) {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.getElementById('wizard-1').classList.add('active');
    document.getElementById('dot-1').classList.add('active');
    document.getElementById('dot-1').classList.remove('completed');
    document.getElementById('dot-2').classList.remove('active', 'completed');
  }
}

function populateResults(data) {
  // Animate price count
  const targetPrice = data.predicted_price;
  const priceEl = document.getElementById('res-price');
  let currentPrice = 0;
  const priceStep = targetPrice / 20; // 20 frames
  
  const timer = setInterval(() => {
    currentPrice += priceStep;
    if (currentPrice >= targetPrice) {
      currentPrice = targetPrice;
      clearInterval(timer);
    }
    priceEl.innerText = `₹${currentPrice.toFixed(2)} L`;
  }, 30);
  
  document.getElementById('res-range').innerText = `Range: ₹${data.price_range.low} L - ₹${data.price_range.high} L`;
  document.getElementById('res-conf').innerText = `Confidence: ${data.confidence}%`;
  document.getElementById('res-sugg').innerText = `₹${data.suggested_listing_price} L`;
  
  // Factors
  const factors = data.factors || {};
  const labels = {
    brand_impact: "Brand Premium",
    depreciation_impact: "Depreciation",
    km_impact: "KM Penalty",
    fuel_impact: "Fuel Type",
    transmission_impact: "Transmission"
  };
  
  const fCont = document.getElementById('factors-container');
  fCont.innerHTML = '';
  Object.keys(labels).forEach(key => {
    const val = factors[key] || 0;
    fCont.innerHTML += `
      <div class="factor-row">
        <div class="factor-labels">
          <span>${labels[key]}</span>
          <span class="factor-val mono">${val}%</span>
        </div>
        <div class="factor-bar-bg">
          <div class="factor-bar-fill" style="width:0%"></div>
        </div>
      </div>
    `;
  });
  
  // Animate bars after a tiny delay
  setTimeout(() => {
    const fills = document.querySelectorAll('.factor-bar-fill');
    Object.values(factors).forEach((val, i) => {
      if (fills[i]) fills[i].style.width = `${val}%`;
    });
  }, 100);
  
  // Tips
  const tList = document.getElementById('tips-list');
  tList.innerHTML = '';
  (data.tips || []).forEach(tip => {
    tList.innerHTML += `<li>${tip}</li>`;
  });
}

// ─── Photo Upload Logic ─────────────────────────────────────
const dropZone = document.getElementById('drop-zone');
const photoInput = document.getElementById('photo-input');
const photoPreview = document.getElementById('photo-preview');

// Prevent default drag behaviors
;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  if (dropZone) {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  }
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight drop zone when item is dragged over it
;['dragenter', 'dragover'].forEach(eventName => {
  if (dropZone) {
    dropZone.addEventListener(eventName, highlight, false);
  }
});

;['dragleave', 'drop'].forEach(eventName => {
  if (dropZone) {
    dropZone.addEventListener(eventName, unhighlight, false);
  }
});

function highlight(e) {
  dropZone.style.borderColor = 'var(--crimson)';
  dropZone.style.backgroundColor = 'rgba(193, 18, 31, 0.05)';
}

function unhighlight(e) {
  dropZone.style.borderColor = 'var(--text-muted)';
  dropZone.style.backgroundColor = 'transparent';
}

// Handle dropped files
if (dropZone) {
  dropZone.addEventListener('drop', handleDrop, false);
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function handleFiles(files) {
  if (!files || files.length === 0) return;
  
  [...files].forEach(previewFile);
  showToast(`${files.length} photo(s) added successfully`);
}

function previewFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Only image files are allowed', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function() {
    const imgContainer = document.createElement('div');
    imgContainer.style.position = 'relative';
    imgContainer.style.width = '100px';
    imgContainer.style.height = '100px';
    imgContainer.style.borderRadius = '0.5rem';
    imgContainer.style.overflow = 'hidden';
    imgContainer.style.border = '1px solid var(--border)';
    
    const img = document.createElement('img');
    img.src = reader.result;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '×';
    removeBtn.style.position = 'absolute';
    removeBtn.style.top = '4px';
    removeBtn.style.right = '4px';
    removeBtn.style.background = 'rgba(0,0,0,0.6)';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '50%';
    removeBtn.style.width = '24px';
    removeBtn.style.height = '24px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.display = 'flex';
    removeBtn.style.alignItems = 'center';
    removeBtn.style.justifyContent = 'center';
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      imgContainer.remove();
    };
    
    imgContainer.appendChild(img);
    imgContainer.appendChild(removeBtn);
    photoPreview.appendChild(imgContainer);
  }
}

// ─── Condition Animation Logic ──────────────────────────────
function updateCondition(val, type = 'sell') {
  const labels = {1: 'Fair', 2: 'Good', 3: 'Excellent'};
  const label = labels[val];
  document.getElementById(`${type}-cond-val`).innerText = label;
  
  const container = document.getElementById(`${type}-condition-car-anim`);
  if (!container) return;
  
  // Remove all condition classes
  container.classList.remove('cond-fair', 'cond-good', 'cond-excellent');
  
  // Elements to toggle
  const smoke = container.querySelector('.anim-smoke');
  const speed = container.querySelector('.anim-speed');
  const sparkle = container.querySelector('.cond-sparkle');
  const crack = container.querySelector('.cond-crack');
  
  // Reset visibility
  if (smoke) smoke.classList.remove('anim-visible');
  if (speed) speed.classList.remove('anim-visible');
  if (sparkle) sparkle.classList.remove('anim-visible');
  if (crack) crack.classList.remove('anim-visible');
  
  // Trigger reflow
  void container.offsetWidth;
  
  // Apply specific condition
  if (val == 3) {
    container.classList.add('cond-excellent');
    if (speed) speed.classList.add('anim-visible');
    if (sparkle) sparkle.classList.add('anim-visible');
  } else if (val == 2) {
    container.classList.add('cond-good');
  } else {
    container.classList.add('cond-fair');
    if (smoke) smoke.classList.add('anim-visible');
    if (crack) crack.classList.add('anim-visible');
  }
}
