import { existsSync, readFileSync } from 'fs';
import { createSecureContext } from 'tls';


export function createStaticSecureContext(key: string, cert: string, ca?: string) {
  const
  config: { [key: string]: Buffer|string|undefined } = {
    key,
    cert,
    ca
  }

  for (const key in config) {
    const path = config[key];

    if (!(path && existsSync(path))) {

      delete config[key];

      continue;
    }

    config[key] = readFileSync(path);
  }

  return createSecureContext(config);
}
