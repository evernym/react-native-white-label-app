// @flow

declare module 'child-process-async' {
  declare type ProcessOutput = {
    stdout: string,
    stdin: string,
  }

  declare export function exec(command: string): Promise<ProcessOutput>
}
