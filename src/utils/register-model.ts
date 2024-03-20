import * as path from 'path';

import { IMidwayContainer } from '@midwayjs/core';
import { glob } from 'glob';
import { Connection, Schema } from 'mongoose';

export async function registerModel(
  container: IMidwayContainer,
  connection: Connection,
  filePath: string
) {
  const fileNameArray = await glob(path.join(filePath, '**/*.entity.[jt]s'));

  const nameSet = new Set();
  for (const fileName of fileNameArray) {
    const data = await import(fileName);

    for (const [schemaName, schema] of Object.entries(data)) {
      if (schema instanceof Schema) {
        const collectionName = (schema as any).options.collection;
        if (!collectionName) {
          throw new Error(
            `Schema "${schemaName}" in file "${fileName}" do not set 'options.collection'`
          );
        }

        if (nameSet.has(collectionName)) {
          throw new Error(`Duplicate collection name "${collectionName}"`);
        }
        nameSet.add(collectionName);

        const model = connection.model(collectionName, schema);
        container.registerObject(schemaName, model);
      }
    }
  }
}
