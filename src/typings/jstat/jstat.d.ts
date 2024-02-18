declare module "jstat" {
    const jstat: {
        factorial: (n: number) => number;
        combination: (n: number, k: number) => number;
        permutation: (n: number, k: number) => number;

        normal: {
            cdf: (x: number, mean: number, std: number) => number;
            inv: (p: number, mean: number, std: number) => number;
        };

        studentt: {
            cdf: (x: number, df: number) => number;
            inv: (p: number, df: number) => number;
        };

        centralF: {
            cdf: (x: number, df1: number, df2: number) => number;
            inv: (p: number, df1: number, df2: number) => number;
        };

        binomial: {
            pdf: (k: number, n: number, p: number) => number;
            cdf: (x: number, n: number, p: number) => number;
        };

        poisson: {
            pdf: (k: number, lambda: number) => number;
            cdf: (x: number, lambda: number) => number;
        };

        exponential: {
            pdf: (x: number, lambda: number) => number;
            cdf: (x: number, lambda: number) => number;
            inv: (p: number, lambda: number) => number;
        };
    };
    export default jstat;
}
