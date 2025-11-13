
// citation: https://developers.google.com/maps/documentation/javascript/adding-a-google-map
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: "AIzaSyB6Vvh_yRrn-AI4tQSxz60pF67yPKmOEhI",
    v: "weekly",
    // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
    // Add other bootstrap parameters as needed, using camel case.
});

let map;
let markers = [];
let currentInfoWindow = null;

export function initMap(mapContainerId) {
    const mapElement = document.getElementById(mapContainerId);
    if (!mapElement) {
        console.error(`Map container with id "${mapContainerId}" not found`);
        return;
    }
    
    const position = { lat: 39.9526, lng: -75.1652 };
    
    google.maps.importLibrary("maps").then(({ Map }) => {
        map = new Map(mapElement, {
            zoom: 13,
            center: position,
            mapId: "Main-Events-Map"
        });
        
        return google.maps.importLibrary("marker");
    }).then(({ PinElement }) => {
        window.PinElement = PinElement;
        
        // to close info boxes when you click off of them
        map.addListener('click', function() {
            if (currentInfoWindow) {
                currentInfoWindow.close();
                currentInfoWindow = null;
            }
        });
        
        loadEvents();
    }).catch(error => {
        console.error('Error loading libraries:', error);
    });
}

function loadEvents() {
    fetch('/api/events')
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error('Failed to fetch events');
            }
        })
        .then(data => {
            if (data.events) {
                console.log(data.events);
                addMarkers(data.events);
            }
        })
        .catch(error => {
            console.error('Error loading events:', error);
        });
}

function addMarkers(events) {
    if (!window.PinElement) {
        console.error('PinElement not available');
        return;
    }
    
    for (let event of events) {
        if (event.lat && event.long) {
            const position = { 
                lat: parseFloat(event.lat), 
                lng: parseFloat(event.long) 
            };
            
            // custom pins for the markers
            const pinElement = new window.PinElement({
                background: "#89F336", 
                borderColor: "#076b3b",
                glyphColor: "#ffffff"
            });
            
            const marker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position: position,
                title: event.title || 'Event in Philly',
                content: pinElement.element
            });
            
            const infoWindow = new google.maps.InfoWindow({
                content: '<div><strong>' + (event.title || 'Event in Philly') + '</strong><br>' + 
                        (event.locationDescription || 'Location not specified') + '</div>',
                disableAutoPan: false
            });
            
            marker.addListener('click', function() {
                if (currentInfoWindow) {
                    currentInfoWindow.close();
                }
                infoWindow.open({
                    anchor: marker,
                    map: map
                });
                currentInfoWindow = infoWindow;
            });
            
            markers.push(marker);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initMap('map'));
} else {
    initMap('map');
}