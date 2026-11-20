export const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "in.localdrivers.app",
      sha256_cert_fingerprints: [
        "12:7D:2C:59:60:67:C8:8B:34:BB:DB:D3:30:32:5E:33:4A:90:36:EC:9D:52:FE:F8:BB:55:D0:82:6F:85:DB:32",
        "91:89:92:07:65:F0:C3:F7:DA:E1:D3:21:C8:74:AC:B8:91:35:5B:91:BC:85:CE:90:F0:38:3F:99:BB:1E:2F:00"
      ]
    }
  }
];

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  return res.status(200).json(ASSET_LINKS);
}
