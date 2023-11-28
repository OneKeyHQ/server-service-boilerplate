"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerModel = void 0;
const path = __importStar(require("path"));
const glob_1 = require("glob");
const mongoose_1 = require("mongoose");
function findDuplicates(array) {
    const duplicates = [];
    const uniqueElements = new Set();
    for (const element of array) {
        if (uniqueElements.has(element)) {
            duplicates.push(element);
        }
        else {
            uniqueElements.add(element);
        }
    }
    return duplicates;
}
const isMongooseSchema = (obj) => {
    var _a;
    if (!obj) {
        return false;
    }
    if (obj instanceof mongoose_1.Schema) {
        return true;
    }
    if (((_a = obj === null || obj === void 0 ? void 0 : obj.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'Schema') {
        return true;
    }
    return false;
};
const getAllEntitySchemas = async (filePath) => {
    const schemas = [];
    const files = await (0, glob_1.glob)(path.join(filePath, '**/*.entity.[jt]s'));
    for (const file of files) {
        const data = await Promise.resolve(`${file}`).then(s => __importStar(require(s)));
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
async function registerModel(container, connection, filePath) {
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
exports.registerModel = registerModel;
