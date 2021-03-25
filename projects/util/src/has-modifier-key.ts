type ModifierKey = 'altKey'|'ctrlKey'|'shiftKey'|'metaKey';

export function hasModifierKey(event: KeyboardEvent, ...modifiers: ModifierKey[]) {
  if (!modifiers.length) {

    modifiers = [ 'altKey', 'ctrlKey', 'shiftKey', 'metaKey' ];

  }

  return modifiers.some(modifier => event[modifier]);
}
