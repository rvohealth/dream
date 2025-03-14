import { spawn } from 'child_process'

export default function sspawn(command: string, opts: any = {}) {
  return new Promise((accept, reject) => {
    ssspawn(command, opts).on('close', code => {
      if (code !== 0) reject(new Error(code?.toString()))
      accept({})
    })
  })
}

export function ssspawn(command: string, opts: any = {}) {
  return spawn(command, {
    stdio: 'inherit',
    shell: true,
    ...opts,
  })
}
