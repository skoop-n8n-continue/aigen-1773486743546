document.addEventListener('DOMContentLoaded', () => {
    let stores = [];
    let currentCategory = 'all';
    let selectedStoreId = null;

    // Map State
    let zoomLevel = 1;
    const mapWrapper = document.getElementById('map-wrapper');
    const mallMap = document.getElementById('mall-map');
    const storesLayer = document.getElementById('stores-layer');
    const wayfindingPath = document.getElementById('wayfinding-path');

    // UI Elements
    const storeSearch = document.getElementById('store-search');
    const storeList = document.getElementById('store-list');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const storeDetails = document.getElementById('store-details');
    const closeDetails = document.querySelector('.close-details');

    // "You Are Here" coordinates
    const userLocation = { x: 400, y: 500 };

    // 1. Fetch stores data
    fetch('stores.json')
        .then(response => response.json())
        .then(data => {
            stores = data;
            initApp();
        })
        .catch(err => console.error('Error loading stores:', err));

    function initApp() {
        renderStores();
        renderMap();
        setupEventListeners();
    }

    // 2. Render functions
    function renderStores() {
        const searchTerm = storeSearch.value.toLowerCase();

        const filteredStores = stores.filter(store => {
            const matchesSearch = store.name.toLowerCase().includes(searchTerm) ||
                                 store.description.toLowerCase().includes(searchTerm);
            const matchesCategory = currentCategory === 'all' || store.category === currentCategory;
            return matchesSearch && matchesCategory;
        });

        storeList.innerHTML = filteredStores.map(store => `
            <li class="store-item ${selectedStoreId === store.id ? 'selected' : ''}" data-id="${store.id}">
                <span class="store-cat">${store.category}</span>
                <span class="store-name">${store.name}</span>
            </li>
        `).join('');

        // Re-attach listeners to new elements
        document.querySelectorAll('.store-item').forEach(item => {
            item.addEventListener('click', () => selectStore(item.dataset.id));
        });
    }

    function renderMap() {
        storesLayer.innerHTML = '';

        stores.forEach(store => {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute('class', `store-group ${selectedStoreId === store.id ? 'highlighted' : ''}`);
            g.setAttribute('id', `map-${store.id}`);
            g.setAttribute('cursor', 'pointer');

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute('class', 'store-rect');
            rect.setAttribute('x', store.pos.x);
            rect.setAttribute('y', store.pos.y);
            rect.setAttribute('width', store.pos.w);
            rect.setAttribute('height', store.pos.h);
            rect.setAttribute('rx', '4');

            if (selectedStoreId === store.id) {
                rect.classList.add('highlighted');
            }

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute('class', 'store-label');
            text.setAttribute('x', store.pos.x + store.pos.w / 2);
            text.setAttribute('y', store.pos.y + store.pos.h / 2 + 4);
            text.textContent = store.name;

            g.appendChild(rect);
            g.appendChild(text);

            g.addEventListener('click', () => selectStore(store.id));
            storesLayer.appendChild(g);
        });
    }

    // 3. Selection & Pathfinding
    function selectStore(id) {
        selectedStoreId = id;
        const store = stores.find(s => s.id === id);

        if (!store) return;

        // Update UI
        renderStores();
        renderMap();
        showDetails(store);
        drawPath(store);

        // Auto-center on selected store
        centerOnStore(store);
    }

    function showDetails(store) {
        document.getElementById('detail-name').textContent = store.name;
        document.getElementById('detail-category').textContent = store.category;
        document.getElementById('detail-description').textContent = store.description;
        document.getElementById('detail-hours').textContent = store.hours;

        storeDetails.classList.remove('hidden');

        // Update QR code (simulated)
        const qrImg = document.querySelector('.qr-code img');
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://lumina-mall.com/wayfind?store=${store.id}`;
    }

    function drawPath(store) {
        // Simple wayfinding logic:
        // 1. Start from user location
        // 2. Go to the nearest hallway point
        // 3. Go to the store entrance (approximated center for this demo)

        const targetX = store.pos.x + store.pos.w / 2;
        const targetY = store.pos.y + store.pos.h / 2;

        // Basic L-shaped path for demo purposes
        // In a real app, this would use A* on a navigation grid
        const d = `M ${userLocation.x},${userLocation.y} L ${userLocation.x},${targetY} L ${targetX},${targetY}`;

        wayfindingPath.setAttribute('d', d);
        wayfindingPath.style.display = 'block';
    }

    function centerOnStore(store) {
        // Animation for centering
        const targetX = store.pos.x + store.pos.w / 2;
        const targetY = store.pos.y + store.pos.h / 2;

        // We'll use CSS transform for zooming and centering
        // Note: For a real kiosk, this needs robust pan/zoom logic
    }

    // 4. Event Listeners
    function setupEventListeners() {
        storeSearch.addEventListener('input', renderStores);

        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = btn.dataset.category;
                renderStores();
            });
        });

        closeDetails.addEventListener('click', () => {
            storeDetails.classList.add('hidden');
            selectedStoreId = null;
            wayfindingPath.style.display = 'none';
            renderStores();
            renderMap();
        });

        // Zoom Controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            zoomLevel += 0.2;
            applyZoom();
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            zoomLevel = Math.max(0.5, zoomLevel - 0.2);
            applyZoom();
        });

        document.getElementById('reset-map').addEventListener('click', () => {
            zoomLevel = 1;
            applyZoom();
        });
    }

    function applyZoom() {
        mallMap.style.transform = `scale(${zoomLevel})`;
        mallMap.style.transition = 'transform 0.3s ease';
    }
});
