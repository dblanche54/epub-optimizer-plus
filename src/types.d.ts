declare module "html-minifier-terser" {
  interface MinifyOptions {
    collapseWhitespace?: boolean;
    removeComments?: boolean;
    minifyCSS?: boolean;
    minifyJS?: boolean;
    [key: string]: boolean | string | number | undefined;
  }

  export function minify(html: string, options?: MinifyOptions): Promise<string>;
}
