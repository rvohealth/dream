declare module 'luxon' {
  const DateTime: (typeof import('../luxon/datetime.js'))['DateTime']
  const Duration: (typeof import('../luxon/duration.js'))['Duration']
  const Info: (typeof import('../luxon/info.js'))['Info']
  const Interval: (typeof import('../luxon/interval.js'))['Interval']
  const Settings: (typeof import('../luxon/settings.js'))['Settings']
  const Zone: (typeof import('../luxon/zone.js'))['Zone']
}
