// flow-typed signature: 1c941f04579d9231f6ab11fd8cd43c30
// flow-typed version: c6154227d1/url-parse_v1.3.x/flow_>=v0.104.x

declare module 'url-parse' {
  declare export type Url = {
    protocol: string,
    slashes: boolean,
    auth: string,
    username: string,
    password: string,
    host: string,
    hostname: string,
    port: string,
    pathname: string,
    query: Object,
    hash: string,
    href: string,
    origin: string,
    set: (
      part: string,
      value: mixed,
      fn?: boolean | ((value: mixed) => Object)
    ) => Url,
    toString: () => string,
    location: (loc?: Object | string) => Object,
    ...
  }

  // In the library, if location is not (Object | string), it is assigned to parser. Therefore,
  // to make less confusing for the user, we type both signatures
  declare type UrlConstructor = ((
    adress: string,
    location: Object | string,
    parser?: boolean | (string => Object)
  ) => Url) &
    ((adress: string, parser?: boolean | (string => Object)) => Url)

  declare export default UrlConstructor
}
