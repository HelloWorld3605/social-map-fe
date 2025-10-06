class LocationSharing {
    constructor(map) {
        this.map = map;
        this.isDragging = false;
        this.draggedMarker = null;
        this.dragPreview = null;

        this.init();
    }

    init() {
        this.attachMarkerEventsOnce();
        this.setupGlobalDragEvents();
    }

    // 🧩 Đảm bảo mỗi marker chỉ gắn 1 lần
    attachMarkerEventsOnce() {
        const attachEvents = () => {
            const markers = document.querySelectorAll('.mapboxgl-marker');

            if (!markers.length) {
                console.log('[LocationSharing] Waiting for markers...');
                return setTimeout(attachEvents, 800);
            }

            markers.forEach((markerEl, index) => {
                if (markerEl.dataset.hasListener === 'true') return; // ⚡ tránh gắn lại
                markerEl.dataset.hasListener = 'true';
                markerEl.dataset.markerId = `marker-${index}`;
                markerEl.style.cursor = 'grab';

                markerEl.addEventListener('mousedown', (e) => this.startDrag(e, markerEl));
            });

            console.log(`[LocationSharing] Attached drag events to ${markers.length} markers`);
        };

        attachEvents();
    }

    setupGlobalDragEvents() {
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', (e) => this.stopDrag(e));
    }

    startDrag(e, markerEl) {
        e.preventDefault();
        e.stopPropagation();

        if (this.isDragging) return; // tránh double-trigger

        this.toggleMapInteractions(false);

        // Dữ liệu marker (hiện tại có 1: Hà Nội)
        this.draggedMarker = {
            name: 'Hà Nội',
            coordinates: [105.8542, 21.0285],
            image: 'image/hanoi.jpg',
            description: 'Thủ đô của Việt Nam – nơi hội tụ giữa cổ kính và hiện đại.'
        };

        this.isDragging = true;
        document.body.style.cursor = 'grabbing';
        markerEl.style.transform += ' scale(1.1)';

        this.createDragPreview(e);
        this.highlightChats(true);
        console.log(`[LocationSharing] Dragging started for ${this.draggedMarker.name}`);
    }

    onDrag(e) {
        if (!this.isDragging || !this.dragPreview) return;

        this.dragPreview.style.left = `${e.clientX + 12}px`;
        this.dragPreview.style.top = `${e.clientY - 32}px`;

        const zone = document.elementFromPoint(e.clientX, e.clientY)?.closest('.chat-window, .side-chat');
        document.querySelectorAll('.location-drop-active').forEach(el => el.classList.remove('location-drop-active'));
        if (zone) zone.classList.add('location-drop-active');
    }

    stopDrag(e) {
        if (!this.isDragging) return;

        const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
        const chatWindow = dropTarget?.closest('.chat-window');
        const sideChat = dropTarget?.closest('.side-chat');

        if (chatWindow) {
            this.shareLocation(chatWindow.dataset.friendId, 'chat-window');
        } else if (sideChat) {
            const activeFriend = document.querySelector('.friend-item.active');
            if (activeFriend)
                this.shareLocation(activeFriend.dataset.friend, 'side-chat');
            else
                this.showMessage('Vui lòng chọn người bạn để chia sẻ vị trí', 'warning');
        }

        this.cleanupDrag();
    }

    cleanupDrag() {
        this.isDragging = false;
        this.draggedMarker = null;
        this.toggleMapInteractions(true);
        document.body.style.cursor = '';

        if (this.dragPreview) this.dragPreview.remove();
        document.querySelectorAll('.location-drop-zone, .location-drop-active')
            .forEach(el => el.classList.remove('location-drop-zone', 'location-drop-active'));

        document.querySelectorAll('.mapboxgl-marker').forEach(el => {
            el.style.transform = el.style.transform.replace(' scale(1.1)', '');
            el.style.cursor = 'grab';
        });

        console.log('[LocationSharing] Dragging ended');
    }

    toggleMapInteractions(enable) {
        const m = this.map;
        if (!m) return;
        const fn = enable ? 'enable' : 'disable';
        m.dragPan[fn]();
        m.scrollZoom[fn]();
        m.doubleClickZoom[fn]();
        m.touchZoomRotate[fn]();
        m.boxZoom[fn]();
    }

    createDragPreview(e) {
        const { name, image } = this.draggedMarker;
        const preview = document.createElement('div');
        preview.className = 'location-drag-preview';
        preview.innerHTML = `
            <div class="drag-preview-content">
                <img src="${image}" alt="${name}" class="drag-preview-image">
                <div class="drag-preview-info"><span>${name}</span></div>
            </div>`;
        document.body.appendChild(preview);
        this.dragPreview = preview;
        this.onDrag(e);
    }

    highlightChats(state) {
        document.querySelectorAll('.chat-window, .side-chat')
            .forEach(el => el.classList.toggle('location-drop-zone', state));
    }

    shareLocation(friendId, type) {
        if (!friendId || !this.draggedMarker) return;
        const msg = {
            id: `loc_${Date.now()}`,
            location: this.draggedMarker,
            timestamp: new Date()
        };

        const container = type === 'chat-window'
            ? document.querySelector(`[data-friend-id="${friendId}"] .chat-window-messages`)
            : document.querySelector('.messages-container');

        if (!container) return;

        container.insertAdjacentHTML('beforeend', this.renderLocationMessage(msg));
        container.scrollTop = container.scrollHeight;
        this.showMessage(`Đã chia sẻ vị trí "${msg.location.name}"`, 'success');
    }

    //Giao diện tin nhắn đẹp hơn
    renderLocationMessage(msg) {
        const { location, timestamp } = msg;
        return `
    <div class="chat-window-message location-message sent">
        <div class="location-card" onclick="focusLocation(${location.coordinates[0]},${location.coordinates[1]},'${location.name}')">
            <div class="location-card-image">
                <img src="${location.image}" alt="${location.name}">
                <div class="overlay-icon">📍</div>
            </div>
            <div class="location-card-content">
                <h4>${location.name}</h4>
                <p>${location.description}</p>
                <button class="location-card-btn">🗺️ Xem trên bản đồ</button>
                <span class="location-time">${timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    </div>`;
    }

    showMessage(text, type = 'info') {
        const n = document.createElement('div');
        n.className = `location-notification ${type}`;
        n.textContent = text;
        document.body.appendChild(n);
        setTimeout(() => n.classList.add('show'), 10);
        setTimeout(() => {
            n.classList.remove('show');
            setTimeout(() => n.remove(), 300);
        }, 2500);
    }
}

// ==== Focus marker ====
window.focusLocation = (lng, lat, name) => {
    if (window.mapboxManager?.map) {
        window.mapboxManager.map.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 });
        window.locationSharing?.showMessage(`Đang di chuyển đến ${name}...`, 'info');
    }
};

// ==== Init ====
window.addEventListener('mapLoaded', (e) => {
    window.locationSharing = new LocationSharing(e.detail.map);
    console.log('✅ LocationSharing ready (no duplicate listeners)');
});
