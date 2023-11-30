import { Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete';

interface IGoplusInfo {
  phishingInfo?: object;
  dappSecurityInfo?: object;
}

interface IHostSecurity extends SoftDeleteDocument {
  host: string;
  isWhiteList?: boolean;
  isBlackList?: boolean;
  goplusInfo?: IGoplusInfo;
}

const HostSecuritySchema = new Schema<IHostSecurity>(
  {
    host: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    isWhiteList: {
      type: Boolean,
      default: false,
    },
    isBlackList: {
      type: Boolean,
      default: false,
    },
    goplusInfo: new Schema<IGoplusInfo>({
      phishingInfo: {
        type: Object,
      },
      dappSecurityInfo: {
        type: Object,
      },
    }),
  },
  { timestamps: true }
);

HostSecuritySchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedAt: true,
});

export const HostSecuritySchemaName = 'HostSecuritySchema';

export { IHostSecurity, HostSecuritySchema };
