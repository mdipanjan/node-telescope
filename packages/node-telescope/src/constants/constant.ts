type MongoQueryMethods =
  | 'find'
  | 'findOne'
  | 'findOneAndUpdate'
  | 'findOneAndDelete'
  | 'updateOne'
  | 'updateMany'
  | 'deleteOne'
  | 'deleteMany'
  | 'count'
  | 'countDocuments'
  | 'estimatedDocumentCount';

export const MongoQueries: MongoQueryMethods[] = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'count',
  'countDocuments',
  'estimatedDocumentCount',
];

export const telescopeRoutePrefix = '/telescope';
