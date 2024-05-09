interface Group {
  name: string;
  emoji: string;
}

export const AllGroups: Array<Group> = [
  { name: 'Cleo', emoji: '🐈‍⬛' },
  { name: 'Ginger', emoji: '🐈' },
  { name: 'Household', emoji: '🏠' },
  { name: 'Trash', emoji: '🚮' },
  { name: 'Hygiene', emoji: '🪥' },
  { name: 'Cleaning', emoji: '🧹' },
  { name: 'Financial', emoji: '💸' },
  { name: 'Technical', emoji: '💻' },
];

export const GroupsByName = new Map(AllGroups.map(x => [x.name, x]));

export function groupEmoji(group: string) {
  return GroupsByName.get(group)?.emoji ?? '❓';
}
