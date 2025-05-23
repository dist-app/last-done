import { Mongo } from 'meteor/mongo';

export interface ChoreAction {
  _id: string;
  userId: string;
  choreName: string;

  createdAt: Date;
  // notes?: string;

  prevActionDays?: number;
  goalIntervalDays?: number;
}

export const ChoreActionsCollection = new Mongo.Collection<ChoreAction>('ChoreActions');
