import { Client as PGClient } from 'pg'

export default class PSQLDreamDriver {
  public client: PGClient
  constructor() {
    this.client = new PGClient()
  }

  public async connect() {
    await this.client.connect()
  }

  public select() {}

  public insert() {}

  public update() {}

  public delete() {}
}

export class NotConnected extends Error {}
