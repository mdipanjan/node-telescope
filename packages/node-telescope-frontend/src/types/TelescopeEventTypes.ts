export enum EventTypes {
  NEW_ENTRY = 'newEntry',
  INITIAL_ENTRIES = 'initialEntries',
  GET_INITIAL_ENTRIES = 'getInitialEntries',
  GET_ENTRY_DETAILS = 'getEntryDetails',
  ENTRY_DETAILS = 'entryDetails',
}

export enum EntryType {
  REQUESTS = 'requests',
  EXCEPTIONS = 'exceptions',
  LOGS = 'logs',
  EVENTS = 'events',
  QUERIES = 'queries',
  VIEWS = 'views',
}
