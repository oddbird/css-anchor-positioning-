// Given a floating element and CSS selector(s) for potential anchor element(s),
// returns the first element that passes validation,
// or `null` if no valid anchor element is found
export function validatedForPositioning(
  floatingEl: HTMLElement | null,
  anchorSelectors: string[],
) {
  if (!floatingEl) {
    return null;
  }

  const anchorElements: NodeListOf<HTMLElement> = document.querySelectorAll(
    anchorSelectors.join(', '),
  );

  for (const anchor of anchorElements) {
    if (isValidAnchorElement(anchor, floatingEl)) {
      return anchor;
    }
  }

  return null;
}

export function isAbsolutelyPositioned(el?: HTMLElement | null) {
  return Boolean(
    el &&
      (el.style.position === 'absolute' ||
        getComputedStyle(el).position === 'absolute'),
  );
}

export function hasDisplayNone(el?: HTMLElement | null) {
  return Boolean(
    el &&
      (el.style.display === 'none' || getComputedStyle(el).display === 'none'),
  );
}

// Determines whether the containing block (CB) of the element
// is the initial containing block (ICB):
// - `offsetParent` returns `null` when the CB is the ICB,
//   except in Firefox where `offsetParent` returns the `body` element
// - Excludes elements when they or their parents have `display: none`
export function isContainingBlockICB(floatingElement: HTMLElement) {
  const isDisplayNone =
    hasDisplayNone(floatingElement) ||
    hasDisplayNone(floatingElement.parentElement);

  const cbIsBodyElementFromFF =
    floatingElement.offsetParent === document.querySelector('body') &&
    navigator.userAgent.includes('Firefox');

  const offsetParentNullOrBody =
    floatingElement.offsetParent === null || cbIsBodyElementFromFF;

  if (offsetParentNullOrBody && !isDisplayNone) {
    return true;
  }
  return false;
}

// Validates that anchor element is a valid anchor for given floating element
export function isValidAnchorElement(
  anchor: HTMLElement,
  floating: HTMLElement,
) {
  // If el has the same containing block as the querying element,
  // el must not be absolutely positioned:
  if (
    isAbsolutelyPositioned(anchor) &&
    anchor.offsetParent === floating.offsetParent
  ) {
    return false;
  }

  // If el has a different containing block from the querying element,
  // the last containing block in el's containing block chain
  // before reaching the querying element's containing block
  // must not be absolutely positioned:
  if (anchor.offsetParent !== floating.offsetParent) {
    let currentCB: HTMLElement | null;
    const anchorCBchain: HTMLElement[] = [];

    currentCB = anchor.offsetParent as HTMLElement | null;
    while (currentCB && currentCB !== floating.offsetParent) {
      anchorCBchain.push(currentCB);
      currentCB = currentCB.offsetParent as HTMLElement | null;
    }

    const lastInChain = anchorCBchain[anchorCBchain.length - 1];
    if (isAbsolutelyPositioned(lastInChain)) {
      return false;
    }
  }

  // Either el must be a descendant of the querying element's containing block,
  // or the querying element's containing block must be
  // the initial containing block:
  const isDescendant = Boolean(floating.offsetParent?.contains(anchor));
  const floatingCBIsInitialCB = isContainingBlockICB(floating);

  if (isDescendant || floatingCBIsInitialCB) {
    return true;
  }

  return false;
}
