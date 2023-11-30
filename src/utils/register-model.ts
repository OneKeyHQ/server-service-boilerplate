import * as path from 'path';

import { IMidwayContainer } from '@midwayjs/core';
import { MongooseDataSourceManager } from '@midwayjs/mongoose';
import { glob } from 'glob';
import { Schema } from 'mongoose';

const isMongooseSchema = (obj: any): obj is Schema => {
  if (!obj) {
    return false;
  }
  if (obj instanceof Schema) {
    return true;
  }
  if (obj?.constructor?.name === 'Schema') {
    return true;
  }
  return false;
};

const getAllEntitySchemas = async (filePath: string) => {
  const schemas: {
    name: string;
    schema: Schema;
    connectionName: string;
  }[] = [];
  const uniqueSchemaKeys = new Set<string>();
  const files = await glob(path.join(filePath, '**/*.entity.[jt]s'));
  for (const file of files) {
    const data = await import(file);
    for (const [k, v] of Object.entries(data)) {
      if (!isMongooseSchema(v)) {
        continue;
      }
      const connectionName = data['ConnectionName'] || 'default';
      const key = `${connectionName}__${k}`;
      if (uniqueSchemaKeys.has(key)) {
        throw new Error(
          `Duplicate schema name: ${k}, connectionName: ${connectionName}`
        );
      }
      uniqueSchemaKeys.add(key);
      schemas.push({
        name: k,
        schema: v,
        connectionName,
      });
    }
  }
  return schemas;
};

export async function registerModel({
  filePath,
  container,
  dataSourceManager,
}: {
  container: IMidwayContainer;
  filePath: string;
  dataSourceManager: MongooseDataSourceManager;
}) {
  const schemas = await getAllEntitySchemas(filePath);

  for (const { name, schema, connectionName } of schemas) {
    const connection = dataSourceManager.getDataSource(connectionName);
    const model = connection.model(name.replace(/Schema$/g, ''), schema);
    container.registerObject(name, model);
  }
}
