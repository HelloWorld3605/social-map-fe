mapboxgl.accessToken = 'pk.eyJ1IjoidHVhbmhhaTM2MjAwNSIsImEiOiJjbWdicGFvbW8xMml5Mmpxd3N1NW83amQzIn0.gXamOjOWJNMeQl4eMkHnSg'; // thay bằng token của bạn



const map = new mapboxgl.Map({
    container: 'map', // id của div
    style: 'mapbox://styles/mapbox/streets-v12', // có thể đổi sang dark, light, satellite...
    center: [105.8542, 21.0285], // [lng, lat] -> Hà Nội
    zoom: 12
});


// Thêm control zoom ở góc phải dưới
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');



// Thêm marker
new mapboxgl.Marker({ color: "red" })
    .setLngLat([105.8542, 21.0285])
    .setPopup(new mapboxgl.Popup().setHTML("<b>Hà Nội</b><br>Thủ đô Việt Nam"))
    .addTo(map);



