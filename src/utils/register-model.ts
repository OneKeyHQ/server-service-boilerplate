import * as path from 'path';

import { IMidwayContainer } from '@midwayjs/core';
import { glob } from 'glob';
import { Connection, Schema } from 'mongoose';

function findDuplicates<T>(array: T[]): T[] {
  const duplicates: T[] = [];
  const uniqueElements = new Set<T>();

  for (const element of array) {
    if (uniqueElements.has(element)) {
      duplicates.push(element);
    } else {
      uniqueElements.add(element);
    }
  }

  return duplicates;
}

const isMongooseSchema = (obj: any): obj is Schema => {
  if(!obj) {
    return false;
  }
  if(obj instanceof Schema) {
    return true;
  }
  if(obj?.constructor?.name === 'Schema') {
    return true;
  }
  return false;
}

const getAllEntitySchemas = async (filePath: string) => {
  const schemas: {
    name: string;
    schema: Schema;
  }[] = [];
  const files = await glob(path.join(filePath, '**/*.entity.[jt]s'));
  for (const file of files) {
    const data = await import(file);
    for (const [k, v] of Object.entries(data)) {
      if (!isMongooseSchema(v)) {
        continue;
      }
      schemas.push({
        name: k,
        schema: v,
      });
    }
  }
  return schemas;
};

export async function registerModel(
  container: IMidwayContainer,
  connection: Connection,
  filePath: string
) {
  const schemas = await getAllEntitySchemas(filePath);

  const duplicates = findDuplicates(schemas.map(item => item.name));

  if (duplicates.length > 0) {
    throw new Error(`Duplicate schema name: ${duplicates.join(',')}`);
  }

  for (const { name, schema } of schemas) {
    const model = connection.model(name.replace(/Schema$/g, ''), schema);
    container.registerObject(name, model);
  }
}
