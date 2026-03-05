const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const RNFB_SNIPPET = `
    # React Native Firebase: allow non-modular includes when use_frameworks! :linkage => :static (fixes RNFBApp/RCTConvert etc. on EAS/iOS)
    rnfb_pods = ['RNFBApp', 'RNFBAuth']
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB') || rnfb_pods.include?(target.name)
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end
`;

function withRNFBPodfileFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) return cfg;
      let podfile = fs.readFileSync(podfilePath, 'utf8');
      if (podfile.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) return cfg;
      const marker = '# @generated end @rnmapbox/maps-post_installer';
      const idx = podfile.indexOf(marker);
      if (idx !== -1) {
        const insertAt = idx + marker.length;
        podfile = podfile.slice(0, insertAt) + RNFB_SNIPPET + podfile.slice(insertAt);
      } else {
        const postInstallMatch = podfile.match(/post_install do \|installer\|[\s\S]*?react_native_post_install/m);
        if (postInstallMatch) {
          const insertAt = postInstallMatch.index + postInstallMatch[0].length - 'react_native_post_install'.length;
          podfile = podfile.slice(0, insertAt) + RNFB_SNIPPET + '\n    ' + podfile.slice(insertAt);
        }
      }
      fs.writeFileSync(podfilePath, podfile);
      return cfg;
    },
  ]);
}

module.exports = withRNFBPodfileFix;
