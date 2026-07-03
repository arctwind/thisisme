/**
 * Attribution Module
 *
 * Outputs project credits to the browser developer console upon initialization.
 */

const ATTRIBUTION_STYLE = [
  'color: #888',
  'font-family: monospace',
].join(';');

const LINK_STYLE = [
  'color: #8ab4f8',
  'font-family: monospace',
  'text-decoration: underline',
].join(';');

export function outputAttribution(): void {
  console.log(
    '%cCredits: Thisisme by arctwind — %chttps://github.com/arctwind/thisisme',
    ATTRIBUTION_STYLE,
    LINK_STYLE,
  );
}
