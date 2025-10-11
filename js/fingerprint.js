// A simple polyfill for Promise if it's not available.
if (typeof Promise === 'undefined') {
  console.error("Promise is not supported in this browser.");
}

(function () {
  'use strict';

  // Ensure the global namespace exists
  if (typeof window.candelas === 'undefined') {
    window.candelas = {};
  }

  // Define the getFingerprint function and attach it to the namespace
  window.candelas.getFingerprint = function() {
    // We will use a very simple and stable fingerprinting method:
    // Concatenate some basic browser properties.
    // This is not as unique as FingerprintJS, but it avoids library conflicts.
    var fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset()
    ].join('-');

    // Simple hash function to make it less readable and more uniform.
    var hash = 0;
    for (var i = 0; i < fingerprint.length; i++) {
      var char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Promise.resolve(String(Math.abs(hash)));
  };

  console.log("Candelas fingerprint function initialized.");
})();