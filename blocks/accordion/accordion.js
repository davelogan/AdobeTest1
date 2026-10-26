/*
 * Accordion block
 *
 * Authoring (in a doc, as a table):
 * | Accordion            |                     |
 * | Question / label     | Answer / body       |
 * | Question / label     | Answer / body       |
 *
 * Variant: "Accordion (single)" keeps only one item open at a time.
 */

export default function decorate(block) {
  const single = block.classList.contains('single');

  [...block.children].forEach((row) => {
    const [labelCell, bodyCell] = row.children;

    // <summary> is the clickable header
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...(labelCell ? labelCell.childNodes : []));

    // body holds whatever the author put in the second cell
    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    if (bodyCell) body.append(...bodyCell.childNodes);

    // native <details> gives keyboard + screen reader support for free
    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, body);

    if (single) {
      details.addEventListener('toggle', () => {
        if (!details.open) return;
        block.querySelectorAll('details[open]').forEach((other) => {
          if (other !== details) other.open = false;
        });
      });
    }

    row.replaceWith(details);
  });
}
