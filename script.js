/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoibXV6bmFtaWFuIiwiYSI6ImNtNXBsc2xjcDAyaWkybm9wZXFuMjNzMTQifQ.0ATJsQJDSlSrpNrQpdMq0Q'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Show the map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map1', // container id in HTML
    style: 'mapbox://styles/muznamian/cm8duefd3003e01paffekeqno',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 11 // starting zoom level
});


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP So we can see the points 
--------------------------------------------------------------------*/
let pedcyc_collisiongeojson; // the points that will show the collision numbers 
fetch('https://raw.githubusercontent.com/muznamian/LAB4/refs/heads/main/pedcyc_collision.geojson')
    .then(response => response.json())
    .then(response => {
        pedcyc_collisiongeojson = response;
    })// this can help to store the geojson as a variable using the URL from the fetch data 

// loading it onto the map so it appears 

    map.on('load', function () {
        // We can add the collision points source
        map.addSource('collisions', {
            type: 'geojson',
            data: pedcyc_collisiongeojson
        });
    
        // We can add the collision points layer
        map.addLayer({
            id: 'collision-points',
            type: 'circle',
            source: 'collisions',
            paint: {
                'circle-radius': 3,
                'circle-color': 'black' // black for visibility
            }
        });
    
        // Generate the hex grid by applying the specific code 
        let envelope = turf.bbox(pedcyc_collisiongeojson);
        console.log("Bounding Box:", envelope);
    
        let hexGrid = turf.hexGrid(envelope, 1, { units: 'kilometers' }); // helping to fix the grid size 
        console.log("Hex Grid:", hexGrid); // checking if it works 
    
        
        let collishex = turf.collect(hexGrid, pedcyc_collisiongeojson, '_id', 'values'); // add in the collision data for hex 
        
        let maxcollisions = 0;
        collishex.features.forEach((feature) => {
            feature.properties.COUNT = feature.properties.values.length; // we want to find the count collisions that occured in each hexagon feature 
            if (feature.properties.COUNT > maxcollisions) {
                maxcollisions = feature.properties.COUNT;
            }
        });
    
        // This will help to add the hex grid source
        map.addSource('collishexgrid', {
            type: 'geojson',
            data: collishex
        });
    
        // This process is important to to add in the hex grid layer
        map.addLayer({
            id: 'collishexfill',
            type: 'fill',
            source: 'collishexgrid', // where the data came from 
            paint: {
                'fill-color': [
                    "step",
                    ["get", "COUNT"],
                    '#ffffff',  // ordering how many collisions for this it is 0 in white 
                    10, 'green',  // for this it is more then 10 in green so it is different 
                    25, 'yellow',  // for this it is more then 25 in yellow so it is different 
                    maxcollisions, "blue"  // the maximum number of collisions can appear in blue
                ],
                'fill-opacity': 0.8
            },
            filter: ['!=', 'COUNT', 0]
        });
    });
// now I want to add a popup to show the collision points 
map.on('click', 'collishexfill', (e) => {
    new mapboxgl.Popup() //Define the new popup object for the click feature
        .setLngLat(e.lngLat) //One idea is a method to set coordinates of popup based on mouse click location
        .setHTML("<b>number of collisions'</b> " + e.features[0].properties.COUNT) // the coli hex grid is the number of collisions in each hexagon 
.addTo(map); // Show the popup on the map

});

   // Allow for zoom and rotation on the map so it is easy to access 
   map.addControl(new mapboxgl.NavigationControl());
