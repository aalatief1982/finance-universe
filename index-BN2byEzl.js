```javascript
var crypto = require('crypto');
var fs = require('fs');

function validateChecksum(filePath, expectedChecksum) {
    var fileBuffer = fs.readFileSync(filePath);
    var hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    var calculatedChecksum = hash.digest('hex');
    console.log('[OTA] Calculated checksum:', calculatedChecksum);
    console.log('[OTA] Expected checksum:', expectedChecksum);
    return calculatedChecksum === expectedChecksum;
}

function downloadUpdate(manifest) {
    console.log('[OTA] Starting download from: ' + manifest.url);
    fetch(manifest.url)
        .then(function(response) {
            if (!response.ok) {
                throw new Error('[OTA] Failed to download update: ' + response.statusText);
            }
            var filePath = 'path/to/save/www.zip';
            var fileStream = fs.createWriteStream(filePath);
            return new Promise(function(resolve, reject) {
                response.body.pipe(fileStream);
                response.body.on('error', reject);
                fileStream.on('finish', resolve);
            }).then(function() {
                console.log('[OTA] Download completed. Validating checksum...');
                if (!manifest.checksum) {
                    throw new Error('[OTA] Manifest checksum is missing. Cannot validate the downloaded file.');
                }
                if (!validateChecksum(filePath, manifest.checksum)) {
                    throw new Error('[OTA] Checksum validation failed. The downloaded file is corrupted.');
                }
                console.log('[OTA] ✅ Download and validation successful');
                // Proceed with applying the update
            });
        })
        .catch(function(error) {
            console.error('[OTA] ❌ Download failed:', error);
        });
}

function checkForUpdates() {
    var manifestUrl = 'https://xpensia-505ac.web.app/manifest.json';
    console.log('[OTA] Fetching manifest from: ' + manifestUrl);
    fetchManifestWithRetry(manifestUrl)
        .then(function(manifest) {
            console.log('[OTA] Manifest fetched successfully:', manifest);
            if (manifest && manifest.version !== getCurrentVersion()) {
                console.log('[OTA] New version available: ' + manifest.version);
                downloadUpdate(manifest);
            } else {
                console.log('[OTA] No new updates available.');
            }
        })
        .catch(function(error) {
            console.error('[OTA] ❌ Failed to check for updates:', error);
        });
}
```