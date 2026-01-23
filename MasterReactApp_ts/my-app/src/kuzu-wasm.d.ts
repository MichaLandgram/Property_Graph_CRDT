declare module '@kuzu/kuzu-wasm' {
    export default function Kuzu(): Promise<{
        Database: any;
        Connection: any;
    }>;
}
