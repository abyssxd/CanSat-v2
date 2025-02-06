const fs = require('fs');
const path = require('path');
const kmlFile = path.join(__dirname, '..', 'live_track.kml');

// Create an initial KML file with an empty linestring
function createInitialKML() {
  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>Live Track</name>
  <Style id="redLine">
    <LineStyle>
      <color>ff0000ff</color>
      <width>4</width>
    </LineStyle>
  </Style>
  <Placemark>
    <name>Track</name>
    <styleUrl>#redLine</styleUrl>
    <LineString>
      <extrude>0</extrude>
      <tessellate>0</tessellate>
      <altitudeMode>absolute</altitudeMode>
      <coordinates>
      </coordinates>
    </LineString>
  </Placemark>
</Document>
</kml>`;
  fs.writeFileSync(kmlFile, kmlContent, 'utf8');
  console.log("Initial KML file created.");
}

// Update the KML file with new coordinates and a LookAt based on the last coordinate
function updateKML(coordinates, lastCoordinate) {
  return new Promise((resolve, reject) => {
    // Build the coordinate string (each coordinate: "lon,lat,alt")
    let coordsString = "";
    coordinates.forEach(coord => {
      coordsString += `${coord[0]},${coord[1]},${coord[2]} `;
    });
    // Create a LookAt element based on the last coordinate (with a slight altitude offset)
    const lookAt = `<LookAt>
      <longitude>${lastCoordinate[0]}</longitude>
      <latitude>${lastCoordinate[1]}</latitude>
      <altitude>${lastCoordinate[2] + 10}</altitude>
      <heading>0</heading>
      <tilt>45</tilt>
      <range>20</range>
      <altitudeMode>absolute</altitudeMode>
    </LookAt>`;
    // Build the new KML content
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  ${lookAt}
  <name>Live Track</name>
  <Style id="redLine">
    <LineStyle>
      <color>ff0000ff</color>
      <width>4</width>
    </LineStyle>
  </Style>
  <Placemark>
    <name>Track</name>
    <styleUrl>#redLine</styleUrl>
    <LineString>
      <extrude>0</extrude>
      <tessellate>0</tessellate>
      <altitudeMode>absolute</altitudeMode>
      <coordinates>
        ${coordsString.trim()}
      </coordinates>
    </LineString>
  </Placemark>
</Document>
</kml>`;
    fs.writeFile(kmlFile, kmlContent, 'utf8', (err) => {
      if (err) {
        console.error("Error updating KML:", err);
        reject(err);
      } else {
        console.log("KML updated.");
        resolve();
      }
    });
  });
}

module.exports = {
  createInitialKML,
  updateKML
};
