/* eslint-disable no-process-env */
import { join, resolve } from 'path';

import * as dotenv from 'dotenv';

export const ServerSecretsPath = resolve(
  '/',
  'mnt',
  'secrets',
  `onekey-eks-dashboard-${process.env.NODE_ENV}.json`
);
export const ServerConfigPath = resolve('/', 'mnt', 'config', 'config.json');

function loadJsonConfigFile(file: string, errorMessage: string) {
  try {
    dotenv.populate(process.env, require(file));
  } catch (error) {
    console.log(errorMessage, file);
  }
}

/*
  加载线上配置文件
*/
loadJsonConfigFile(ServerConfigPath, 'No config found path:');
loadJsonConfigFile(ServerSecretsPath, 'No secrets found path:');
loadJsonConfigFile(
  join(__dirname, '..', '.config.json'),
  'No local json config found'
);

/*
  加载本地配置文件，注意.config.json和.env只需要一个即可，两个都存在的话，.config.json会覆盖.env
*/
dotenv.config({
  path: join(__dirname, '..', '.env'),
});
