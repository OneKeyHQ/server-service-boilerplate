type normalizeMongooseOpts = {
  uuidField?: string;
};

const normalizeMongoose = (schema, opts: normalizeMongooseOpts = {}) => {
  const {
    toJSON,
    normalizeId,
    removeVersion,
    removePrivatePaths,
    // @ts-expect-error
    toJSON: { transform } = {},
  } = schema.options;

  const json = {
    transform(doc, returnValue, options) {
      if (!removePrivatePaths) {
        const { paths } = schema;

        for (const path in paths) {
          if (
            paths[path].options &&
            paths[path].options.private &&
            returnValue[path]
          ) {
            delete returnValue[path];
          }
        }
      }

      if (!removeVersion) {
        const { __v } = returnValue;

        if (!__v) {
          delete returnValue.__v;
        }
      }

      if (opts?.uuidField && returnValue[opts?.uuidField]) {
        const bufferHexVal = Buffer.from(
          returnValue[opts.uuidField].data
        ).toString('hex');
        returnValue[opts.uuidField] = bufferHexVal.replace(
          /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
          '$1-$2-$3-$4-$5'
        );
      }

      if (!normalizeId) {
        const { _id, id } = returnValue;

        if (_id && !id) {
          // returnValue.id = _id.toString();
          delete returnValue._id;
        }
      }

      if (transform) {
        return transform(doc, returnValue, options);
      }
    },
  };

  schema.options.toJSON = { ...toJSON, ...json };
};

export default normalizeMongoose;
