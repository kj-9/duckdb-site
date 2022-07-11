export enum SpecialKeys {
  Alt = 'Alt',
  ArrowDown = 'ArrowDown',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  ArrowUp = 'ArrowUp',
  Backspace = 'Backspace',
  Capslock = 'Capslock',
  Dead = 'Dead',
  Delete = 'Delete',
  Enter = 'Enter',
  Key = 'Key',
  Meta = 'Meta',
  Shift = 'Shift',
  Tab = 'Tab',
}

export type CharKey = string;
export type Keys = SpecialKeys | CharKey;
