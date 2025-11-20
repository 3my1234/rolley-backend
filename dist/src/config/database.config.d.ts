declare const _default: (() => {
    url: string;
    ssl: boolean | {
        rejectUnauthorized: boolean;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    url: string;
    ssl: boolean | {
        rejectUnauthorized: boolean;
    };
}>;
export default _default;
