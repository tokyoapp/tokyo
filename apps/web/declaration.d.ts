import "solid-js";

type ElementProps<T> = {
  [K in keyof T]: CustomElementProps<T[K]>;
};

type CustomElementChildren = Element | Element[] | JSX.Element | JSX.Element[];

type CustomElementProps<T> = {
  [K in keyof Omit<T, "children"> as string & K]?: T[K];
} & { children?: CustomElementChildren; class?: string };

// global
interface CustomElements extends ElementProps<HTMLElementTagNameMap> {}

declare namespace JSX {
  // react jsx
  // @ts-ignore
  interface IntrinsicElements extends ElementProps<HTMLElementTagNameMap> {}
}

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements extends CustomElements {}
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "action-button": any;
  }
}
