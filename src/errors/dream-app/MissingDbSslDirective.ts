export default class MissingDbSslDirective extends Error {
  private connectionName: string
  private credentialKey: 'primary' | 'replica'
  constructor(connectionName: string, credentialKey: 'primary' | 'replica') {
    super()
    this.connectionName = connectionName
    this.credentialKey = credentialKey
  }

  public override get message() {
    return `
DreamApp refused to register a db credential without an explicit TLS
directive. Every \`SingleDbCredential\` passed to \`app.set('db', ...)\`
must set one of:

  ssl: { rejectUnauthorized: true }              // verified TLS (system CA)
  ssl: { rejectUnauthorized: true, ca: <pem> }   // verified TLS (private CA)
  ssl: { rejectUnauthorized: false }             // unverified TLS
  ssl: false                                     // TLS disabled
  useSsl: true                                   // legacy, deprecated

Omitting the directive used to silently disable TLS. Throwing here
turns the safety question into a deliberate decision at the call
site, so a credential cannot reach production with TLS off by accident.

  connection: ${this.connectionName}
  credential: ${this.credentialKey}
    `
  }
}
