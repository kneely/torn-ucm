import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findAttackButton,
  findBySemanticSelector,
  findByTextMatch,
} from '../src/dom/selectors.js';

function makeElement({ tagName = 'DIV', text = '', type = '', className = '', visible = true, children = [] } = {}) {
  const element = {
    tagName: tagName.toUpperCase(),
    textContent: text,
    className,
    children: [],
    parentElement: null,
    offsetParent: visible ? {} : null,
    getAttribute(name) {
      if (name === 'type') return type || null;
      if (name === 'class') return className || null;
      return null;
    },
    matches(selector) {
      if (selector === 'button') return this.tagName === 'BUTTON';
      if (selector === 'button[type="submit"]') return this.tagName === 'BUTTON' && type === 'submit';
      if (selector === '[class*="defender"]') return className.includes('defender');
      return false;
    },
    querySelector(selector) {
      return querySelectorAll(this, selector)[0] || null;
    },
    querySelectorAll(selector) {
      return querySelectorAll(this, selector);
    },
    closest(selector) {
      let node = this;
      while (node) {
        if (node.matches(selector)) return node;
        node = node.parentElement;
      }
      return null;
    },
  };

  for (const child of children) {
    child.parentElement = element;
    element.children.push(child);
  }

  return element;
}

function querySelectorAll(root, selector) {
  const matches = [];
  function visit(node) {
    if (node.matches?.(selector)) matches.push(node);
    for (const child of node.children || []) visit(child);
  }
  for (const child of root.children || []) visit(child);
  return matches;
}

function installDocument(root) {
  global.window = {
    location: { href: 'https://www.torn.com/page.php?sid=attack' },
    getComputedStyle() {
      return { display: 'block', visibility: 'visible', opacity: '1' };
    },
  };
  global.document = {
    querySelector(selector) {
      if (selector.startsWith('#react-root')) return null;
      return root.querySelector(selector);
    },
    querySelectorAll(selector) {
      return root.querySelectorAll(selector);
    },
    evaluate() {
      return { singleNodeValue: null };
    },
  };
  global.XPathResult = { FIRST_ORDERED_NODE_TYPE: 9 };
}

test('finds the Start fight button inside the defender modal first', () => {
  const unrelatedStartFight = makeElement({ tagName: 'BUTTON', type: 'submit', text: 'Start fight' });
  const defenderButton = makeElement({ tagName: 'BUTTON', type: 'submit', text: 'Start fight' });
  const root = makeElement({
    children: [
      makeElement({ children: [unrelatedStartFight] }),
      makeElement({
        className: 'modal___lMj6N defender___niX1M',
        children: [
          makeElement({
            className: 'dialogWrapper___KPjs5',
            children: [
              makeElement({
                className: 'dialog___Q0GdI green___V3RxZ',
                children: [
                  makeElement({ className: 'dialogButtons___nX4Bz', children: [defenderButton] }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  installDocument(root);

  assert.equal(findBySemanticSelector(), defenderButton);
  assert.equal(findAttackButton(), defenderButton);
});

test('does not text-match Start fight buttons outside the defender modal', () => {
  const unrelatedStartFight = makeElement({ tagName: 'BUTTON', text: 'Start fight' });
  const root = makeElement({ children: [makeElement({ children: [unrelatedStartFight] })] });
  installDocument(root);

  assert.equal(findByTextMatch(), null);
});
