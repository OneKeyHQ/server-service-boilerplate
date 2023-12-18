import fs from 'fs';
import path from 'path';

function buildLocaleJSON() {
  return fs
    .readdirSync(__dirname)
    .filter(item => /\.json/.test(item))
    .reduce((memo, curr) => {
      const filename = curr.replace('.json', '');
      return {
        ...memo,
        [filename]: {
          default: require(path.resolve(__dirname, curr)),
        },
      };
    }, {});
}

const localeJSON = buildLocaleJSON();

export default localeJSON;
