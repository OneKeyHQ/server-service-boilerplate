export declare function SuccessWrapper<T>(ResourceCls: T): {
    new (): {
        code: number;
        message: string;
        data: T;
    };
};
