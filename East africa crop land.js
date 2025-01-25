// Define start and end dates
var time_start = '2001-01-01', time_end = '2024-01-01';


// Center the map on the geometry
Map.centerObject(geometry);

// Load the MODIS Land Cover dataset
var modis = ee.ImageCollection('MODIS/006/MCD12Q1')
              .filterDate(time_start, time_end)
              .select('LC_Type1');  // Select the land cover type band

// Function to calculate cropland area for each image
function cropland_area(img) {
  // Classify pixels as cropland: Classes 12 (cropland) and 14 (cropland/natural vegetation mosaic)
  var cropland = img.eq(12).or(img.eq(14));
  var croplandMasked = cropland.updateMask(cropland);  // Mask non-cropland areas
  
  // Calculate area in square kilometers
  var area = croplandMasked.multiply(ee.Image.pixelArea().divide(1e6));
  
  // Sum the cropland area within the region and add it as a property to each image
  var totalArea = area.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: geometry,
    scale: 5000,  // Coarser scale to reduce computation
    bestEffort: true,
    maxPixels: 1e8
  }).get('LC_Type1');
  
  // Return image with cropland area as a property
  return img.set('cropland_area_km2', totalArea)
            .set('system:time_start', img.get('system:time_start'));
}

// Apply the cropland area function to each MODIS image
var croplandSeries = modis.map(cropland_area);

// Create a time series chart of cropland area
var chart = ui.Chart.feature.byFeature({
  features: croplandSeries,
  xProperty: 'system:time_start',
  yProperties: ['cropland_area_km2']
})
.setOptions({
  title: 'East African Cropland Area Over Time',
  hAxis: {title: 'Year'},
  vAxis: {title: 'Cropland Area (sq km)'},
  lineWidth: 2,
  pointSize: 3,
});

// Print the chart
print(chart);
