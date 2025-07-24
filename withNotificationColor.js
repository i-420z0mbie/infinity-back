// withNotificationColor.js
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withNotificationColor(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    // Ensure tools namespace
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] =
      manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';

    // Ensure an <application> element exists
    if (!manifest.application || manifest.application.length === 0) {
      manifest.application = [{ $: {} }];
    }
    const application = manifest.application[0];
    application['meta-data'] = application['meta-data'] || [];

    // Replace or add default_notification_color
    let found = false;
    application['meta-data'] = application['meta-data'].map((item) => {
      if (
        item.$['android:name'] ===
        'com.google.firebase.messaging.default_notification_color'
      ) {
        found = true;
        return {
          $: {
            'android:name':
              'com.google.firebase.messaging.default_notification_color',
            // Use Android system white color
            'android:resource': '@android:color/white',
            'tools:replace': 'android:resource',
          },
        };
      }
      return item;
    });

    if (!found) {
      application['meta-data'].push({
        $: {
          'android:name':
            'com.google.firebase.messaging.default_notification_color',
          'android:resource': '@android:color/white',
          'tools:replace': 'android:resource',
        },
      });
    }

    return config;
  });
};
